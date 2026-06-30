package com.loopbook.be_api.dtos;

import java.time.LocalDateTime;
import java.util.UUID;

public class ComplaintResponse {

    private UUID id;
    private UUID complainantId;
    private String complainantName;
    private UUID defendantId;
    private String defendantName;
    private String transactionId;
    private String bookId;
    private String title;
    private String description;
    private String evidenceUrls;
    private String type;
    private String status;
    private String resolutionNote;
    private UUID resolvedBy;
    private LocalDateTime resolvedAt;
    private Boolean bookReturned;
    private LocalDateTime bookReturnedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Getters & Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getComplainantId() { return complainantId; }
    public void setComplainantId(UUID complainantId) { this.complainantId = complainantId; }

    public String getComplainantName() { return complainantName; }
    public void setComplainantName(String complainantName) { this.complainantName = complainantName; }

    public UUID getDefendantId() { return defendantId; }
    public void setDefendantId(UUID defendantId) { this.defendantId = defendantId; }

    public String getDefendantName() { return defendantName; }
    public void setDefendantName(String defendantName) { this.defendantName = defendantName; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public String getBookId() { return bookId; }
    public void setBookId(String bookId) { this.bookId = bookId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getEvidenceUrls() { return evidenceUrls; }
    public void setEvidenceUrls(String evidenceUrls) { this.evidenceUrls = evidenceUrls; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getResolutionNote() { return resolutionNote; }
    public void setResolutionNote(String resolutionNote) { this.resolutionNote = resolutionNote; }

    public UUID getResolvedBy() { return resolvedBy; }
    public void setResolvedBy(UUID resolvedBy) { this.resolvedBy = resolvedBy; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }

    public Boolean getBookReturned() { return bookReturned; }
    public void setBookReturned(Boolean bookReturned) { this.bookReturned = bookReturned; }

    public LocalDateTime getBookReturnedAt() { return bookReturnedAt; }
    public void setBookReturnedAt(LocalDateTime bookReturnedAt) { this.bookReturnedAt = bookReturnedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}