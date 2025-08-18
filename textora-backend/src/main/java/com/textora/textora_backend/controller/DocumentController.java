package com.textora.textora_backend.controller;

import com.textora.textora_backend.model.Document;
import com.textora.textora_backend.service.DocumentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Base64;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    private static final Logger logger = LoggerFactory.getLogger(Document.class);

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping
    public ResponseEntity<?> createDocument(@RequestBody Map<String, String> body) {
        String title = body.get("title");
        String contentBase64 = body.get("content");

        if (title == null || contentBase64 == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Title and content must be provided"));
        }

        byte[] contentBytes;
        try {
            contentBytes = Base64.getDecoder().decode(contentBase64);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", "Content must be a valid Base64 string"));
        }

        Document doc = new Document();
        doc.setTitle(title);
        doc.setContent(contentBytes);

        Document created = documentService.createDocument(doc);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDocument(@PathVariable String id) {
        Document doc = documentService.getDocumentById(id);
        logger.info(doc==null?"":doc.getId());
        if (doc == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Document not found"));
        }
        logger.info(doc.toString());

        String contentBase64 = Base64.getEncoder().encodeToString(doc.getContent());

        return ResponseEntity.ok(Map.of(
                "id", doc.getId(),
                "title", doc.getTitle(),
                "content", contentBase64,
                "createdAt", doc.getCreatedAt(),
                "updatedAt", doc.getUpdatedAt()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDocument(@PathVariable String id, @RequestBody Map<String, String> body) {
        String title = body.get("title");
        String contentBase64 = body.get("content");

        byte[] contentBytes = null;
        if (contentBase64 != null) {
            try {
                contentBytes = Base64.getDecoder().decode(contentBase64);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Content must be a valid Base64 string"));
            }
        }

        Document updated = documentService.updateDocument(id, title, contentBytes);
        if (updated == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Document not found for update"));
        }

        String updatedContentBase64 = Base64.getEncoder().encodeToString(updated.getContent());

        return ResponseEntity.ok(Map.of(
                "id", updated.getId(),
                "title", updated.getTitle(),
                "content", updatedContentBase64,
                "createdAt", updated.getCreatedAt(),
                "updatedAt", updated.getUpdatedAt()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable String id) {
        boolean deleted = documentService.deleteDocument(id);
        if (!deleted) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Document not found for deletion"));
        }
        return ResponseEntity.ok(Map.of("message", "Document deleted successfully"));
    }
}
