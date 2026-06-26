package com.loopbook.be_api.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.DynamicInsert;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@DynamicInsert
@Table(name = "lb_transactions")
public class Transaction {

    @Id
    private String id;

    @Column(nullable = false)
    private String book;

    @Column(nullable = false)
    private String partner;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String amount;

    @Column(name = "when_time", nullable = false)
    private String whenTime;

    @Column(name = "is_completed")
    private Boolean isCompleted;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "book_id")
    private String bookId;

    @Column(name = "buyer_id")
    private UUID buyerId;

    @Column(name = "seller_id")
    private UUID sellerId;

    @Column(name = "fee_amount", nullable = false)
    private Integer feeAmount = 0;

    @Column(name = "fee_rate", precision = 5, scale = 2, nullable = false)
    private BigDecimal feeRate = BigDecimal.ZERO;

    @Column(name = "net_amount", nullable = false)
    private Integer netAmount = 0;

    @Column(nullable = false)
    private String type;

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_ref")
    private String paymentRef;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    // Getters & Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getBook() { return book; }
    public void setBook(String book) { this.book = book; }

    public String getPartner() { return partner; }
    public void setPartner(String partner) { this.partner = partner; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAmount() { return amount; }
    public void setAmount(String amount) { this.amount = amount; }

    public String getWhenTime() { return whenTime; }
    public void setWhenTime(String whenTime) { this.whenTime = whenTime; }

    public Boolean getIsCompleted() { return isCompleted; }
    public void setIsCompleted(Boolean isCompleted) { this.isCompleted = isCompleted; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getBookId() { return bookId; }
    public void setBookId(String bookId) { this.bookId = bookId; }

    public UUID getBuyerId() { return buyerId; }
    public void setBuyerId(UUID buyerId) { this.buyerId = buyerId; }

    public UUID getSellerId() { return sellerId; }
    public void setSellerId(UUID sellerId) { this.sellerId = sellerId; }

    public Integer getFeeAmount() { return feeAmount; }
    public void setFeeAmount(Integer feeAmount) { this.feeAmount = feeAmount; }

    public BigDecimal getFeeRate() { return feeRate; }
    public void setFeeRate(BigDecimal feeRate) { this.feeRate = feeRate; }

    public Integer getNetAmount() { return netAmount; }
    public void setNetAmount(Integer netAmount) { this.netAmount = netAmount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getPaymentRef() { return paymentRef; }
    public void setPaymentRef(String paymentRef) { this.paymentRef = paymentRef; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }
}
