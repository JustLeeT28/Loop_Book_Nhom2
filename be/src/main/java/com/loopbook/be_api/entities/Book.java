package com.loopbook.be_api.entities;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "lb_books", indexes = {
    @Index(name = "idx_seller", columnList = "seller_id"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_category", columnList = "category"),
    @Index(name = "idx_created", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Book {
    @Id
    private String id;
    
    private String title;
    
    private String description;
    
    private String category;
    
    private String condition;
    
    private BigDecimal price;
    
    private BigDecimal originalPrice;
    
    private String author;
    
    private String publisher;
    
    private String edition;
    
    private String school;
    
    private Integer year;
    
    private Boolean urgent;
    
    private LocalDateTime boostExpiry;
    
    private Boolean allowOffers;
    
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String images; // JSON array of URLs
    
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String deliveryMethods; // JSON array
    
    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private String tags; // JSON array
    
    private String locationText;
    
    private String status; // active, draft, sold, pending, rejected, flagged
    
    private UUID sellerId;
    
    @CreationTimestamp
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    private Boolean isSold;
    
    private LocalDateTime soldAt;
    
    private Integer viewCount;
    
    private Integer favoriteCount;
    
    private String rejectReason;

    private String premiumPlanId;
}
