import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from "yjs";

const API_BASE_URL = "http://host.docker.internal:8080/api/documents";

interface DocumentData {
  id: string;
  title: string;
  content: string; 
  createdAt: string;
  updatedAt: string;
}

interface UpdatePayload {
  title: string;
  content: string; 
}

function base64ToUint8Array(base64: string): Uint8Array {
  console.log("[Decode] Base64 → Uint8Array, length:", base64.length);
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  console.log("[Encode] Uint8Array → Base64, byteLength:", bytes.byteLength);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default class YjsServer implements Party.Server {
  constructor(public party: Party.Room) {}

  async onConnect(conn: Party.Connection): Promise<void> {
    console.log(`[Connect] New client connected. Party ID: ${this.party.id}, Conn ID: ${conn.id}`);

    await onConnect(conn, this.party, {
      load: async (): Promise<Y.Doc> => {
        const docId = this.party.id;
        console.log(`[Load] Fetching document from API: ${API_BASE_URL}/${docId}`);

        try {
          const res = await fetch(`${API_BASE_URL}/${docId}`);

          if (res.status === 404) {
            console.warn(`[Load] Document ${docId} not found. Creating new Y.Doc.`);
            const doc = new Y.Doc();
            doc.getXmlFragment("prosemirror"); 
            return doc;
          }

          if (!res.ok) {
            throw new Error(`Failed to fetch document: ${res.statusText}`);
          }

          const data = (await res.json()) as DocumentData;
          console.log(`[Load] Document loaded:`, { id: data.id, title: data.title, updatedAt: data.updatedAt });

          const doc = new Y.Doc();

          if (data.content) {
            console.log(`[Load] Applying update from stored content.`);
            const contentAsUint8Array = base64ToUint8Array(data.content);
            Y.applyUpdate(doc, contentAsUint8Array);
          } else {
            console.log(`[Load] No content found for document ${docId}. Initializing rich-text fragment.`);
            doc.getXmlFragment("prosemirror"); 
          }

          return doc;
        } catch (err) {
          console.error(`[Load] Error fetching document ${docId}:`, err);
          const doc = new Y.Doc();
          doc.getXmlFragment("prosemirror"); 
          return doc;
        }
      },

      callback: {
        handler: async (yDoc: Y.Doc): Promise<void> => {
          const docId = this.party.id;
          console.log(`[Save] Persisting document: ${docId}`);

          try {
            const stateVector = Y.encodeStateAsUpdate(yDoc);
            const contentAsBase64 = uint8ArrayToBase64(stateVector);

            const requestBody: UpdatePayload = {
              title: "Textora",
              content: contentAsBase64,
            };

            const res = await fetch(`${API_BASE_URL}/${docId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestBody),
            });

            if (!res.ok) {
              throw new Error(`Failed to persist document: ${res.statusText}`);
            }

            console.log(`[Save] Document ${docId} persisted successfully.`);
          } catch (err) {
            console.error(`[Save] Error persisting document ${docId}:`, err);
          }
        },
        debounceWait: 2000,
        debounceMaxWait: 10000,
      },
    });
  }
}
