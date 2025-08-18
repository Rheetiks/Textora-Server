package com.textora.textora_backend.service;

import com.textora.textora_backend.exception.DocumentNotFoundException;
import com.textora.textora_backend.model.Document;
import com.textora.textora_backend.repository.DocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;


@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    

    public DocumentService(DocumentRepository documentRepository) {
        this.documentRepository = documentRepository;
    }

    public Document createDocument(Document document) {
        if (!StringUtils.hasText(document.getTitle()) || document.getContent() == null ) {
            throw new IllegalArgumentException("Title and content must be provided");
        }
        return documentRepository.save(document);
    }

    public Document getDocumentById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new DocumentNotFoundException("Document with id " + id + " not found"));
    }

    @Transactional
    public Document updateDocument(String id, String newTitle, byte[] newContent) {
        Document doc = getDocumentById(id);

        if ((newTitle == null || newTitle.isBlank()) && (newContent == null || newContent.length == 0)) {
            throw new IllegalArgumentException("At least one of title or content must be provided");
        }

        if (StringUtils.hasText(newTitle)) {
            doc.setTitle(newTitle);
        }
        if (newContent != null && newContent.length > 0) {
            doc.setContent(newContent);
        }

        return documentRepository.save(doc);
    }

    public boolean deleteDocument(String id) {
        if (!documentRepository.existsById(id)) {
            return false; 
        }
        documentRepository.deleteById(id);
        return true; 
    }
}
