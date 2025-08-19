import type * as Party from "partykit/server";
import { onConnect } from "y-partykit";
import * as Y from "yjs";


const API_BASE_URL = "http://localhost:8080";

  


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
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export default class YjsServer implements Party.Server {
  constructor(public party: Party.Room) {}
  

  static async onBeforeConnect(req: Party.Request, lobby: Party.Lobby, ctx: Party.ConnectionContext) {
    const url = new URL(req.url);
    const roomId = url.pathname.split("/").pop();

    try {
      const res = await fetch(`${API_BASE_URL}/api/documents/${roomId}`);
      if (!res.ok) {
        console.log('not found')
        console.log(res)
        return new Response("Document not found", { status: 404 });
      }
    } catch (err) {
      return new Response("Internal server error", { status: 500 });
    }

    return undefined;
  }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext): Promise<void> {
    console.log(`[Connect] New client connected. Party ID: ${this.party.id}, Conn ID: ${conn.id}`);

    await onConnect(conn, this.party, {
      load: async (): Promise<Y.Doc> => {
        const docId = this.party.id;
        console.log(`[Load] Fetching document from API: ${API_BASE_URL}/api/documents/${docId}`);

        const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`);
        const data = (await res.json()) as DocumentData;

        const doc = new Y.Doc();
        if (data.content) {
          console.log(`[Load] Applying update from stored content.`);
          const contentAsUint8Array = base64ToUint8Array(data.content);
          Y.applyUpdate(doc, contentAsUint8Array);
        } else {
          console.log(`[Load] No content found. Initializing empty doc.`);
          doc.getXmlFragment("prosemirror");
        }

        return doc;
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

            const res = await fetch(`${API_BASE_URL}/api/documents/${docId}`, {
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
