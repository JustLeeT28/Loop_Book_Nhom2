package com.loopbook.be_api.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private UUID id;
    private String name;
    private String email;
    private String phone;
    private String avatarUrl;
    private String bio;
    private String address;
    private String status;
    private String role;
    private BigDecimal rating;
    private Integer responseTime;
    private Integer walletBalance;
    private Integer totalIncome;
    private Integer totalWithdrawn;
    private Integer listingsCount;
    private Integer salesCount;
    private LocalDate joinDate;
    private LocalDateTime createdAt;
}