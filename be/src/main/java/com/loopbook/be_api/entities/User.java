package com.loopbook.be_api.entities;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "lb_users")
public class User {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    private String phone;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(nullable = false)
    private String status = "active";

    @Column(nullable = false)
    private String role = "user";

    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "response_time")
    private Integer responseTime;

    @Column(name = "wallet_balance", nullable = false)
    private Integer walletBalance = 0;

    @Column(name = "total_income", nullable = false)
    private Integer totalIncome = 0;

    @Column(name = "total_withdrawn", nullable = false)
    private Integer totalWithdrawn = 0;

    @Column(name = "listings_count", nullable = false)
    private Integer listingsCount = 0;

    @Column(name = "sales_count", nullable = false)
    private Integer salesCount = 0;

    @Column(name = "rating_sum", nullable = false)
    private Integer ratingSum = 0;

    @Column(name = "rating_count", nullable = false)
    private Integer ratingCount = 0;

    @Column(name = "join_date", nullable = false)
    private LocalDate joinDate = LocalDate.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (joinDate == null) joinDate = LocalDate.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public BigDecimal getRating() { return rating; }
    public void setRating(BigDecimal rating) { this.rating = rating; }

    public Integer getResponseTime() { return responseTime; }
    public void setResponseTime(Integer responseTime) { this.responseTime = responseTime; }

    public Integer getWalletBalance() { return walletBalance; }
    public void setWalletBalance(Integer walletBalance) { this.walletBalance = walletBalance; }

    public Integer getTotalIncome() { return totalIncome; }
    public void setTotalIncome(Integer totalIncome) { this.totalIncome = totalIncome; }

    public Integer getTotalWithdrawn() { return totalWithdrawn; }
    public void setTotalWithdrawn(Integer totalWithdrawn) { this.totalWithdrawn = totalWithdrawn; }

    public Integer getListingsCount() { return listingsCount; }
    public void setListingsCount(Integer listingsCount) { this.listingsCount = listingsCount; }

    public Integer getSalesCount() { return salesCount; }
    public void setSalesCount(Integer salesCount) { this.salesCount = salesCount; }

    public Integer getRatingSum() { return ratingSum; }
    public void setRatingSum(Integer ratingSum) { this.ratingSum = ratingSum; }

    public Integer getRatingCount() { return ratingCount; }
    public void setRatingCount(Integer ratingCount) { this.ratingCount = ratingCount; }

    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}