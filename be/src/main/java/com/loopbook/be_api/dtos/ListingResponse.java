package com.loopbook.be_api.dtos;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingResponse {
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
    
    private Boolean allowOffers;
    
    private List<String> images;
    
    private List<String> deliveryMethods;
    
    private List<String> tags;
    
    private String locationText;
    
    private String status;
    
    @JsonProperty("sellerId")
    private String sellerId;
    
    private SellerInfo seller;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private Boolean isSold;
    
    private LocalDateTime soldAt;
    
    private Integer viewCount;
    
    private Integer favoriteCount;
    
    private String rejectReason;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SellerInfo {
        private String id;
        private String name;
        private String avatarUrl;
        private BigDecimal rating;
        private Integer salesCount;
    }
}