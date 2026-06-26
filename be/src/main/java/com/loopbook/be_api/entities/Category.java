package com.loopbook.be_api.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lb_categories")
public class Category {
    
    @Id
    private String id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String accent;
    
    private String slug;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String icon;
    
    @Column(name = "books_count", nullable = false)
    private Integer booksCount = 0;
    
    @Column(name = "order", nullable = false)
    private Integer order = 0;
    
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getAccent() {
        return accent;
    }
    
    public void setAccent(String accent) {
        this.accent = accent;
    }
    
    public String getSlug() {
        return slug;
    }
    
    public void setSlug(String slug) {
        this.slug = slug;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getIcon() {
        return icon;
    }
    
    public void setIcon(String icon) {
        this.icon = icon;
    }
    
    public Integer getBooksCount() {
        return booksCount;
    }
    
    public void setBooksCount(Integer booksCount) {
        this.booksCount = booksCount;
    }
    
    public Integer getOrder() {
        return order;
    }
    
    public void setOrder(Integer order) {
        this.order = order;
    }
    
    public Boolean getIsActive() {
        return isActive;
    }
    
    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}