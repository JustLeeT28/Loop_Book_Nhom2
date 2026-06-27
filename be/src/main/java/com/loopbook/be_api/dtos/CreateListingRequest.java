package com.loopbook.be_api.dtos;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateListingRequest {
    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;
    
    @NotBlank(message = "Danh mục không được để trống")
    private String category;
    
    @NotBlank(message = "Tình trạng không được để trống")
    private String condition;
    
    @NotNull(message = "Giá không được để trống")
    @Positive(message = "Giá phải lớn hơn 0")
    private BigDecimal price;
    
    @NotNull(message = "Danh sách ảnh không được để trống")
    private List<String> images; // URLs from Supabase Storage
    
    private String description;
    
    private String author;
    
    private String publisher;
    
    private String edition;
    
    private String school;
    
    private Integer year;
    
    private Boolean urgent;
    
    private Boolean allowOffers;
    
    @NotNull(message = "Hình thức giao dịch không được để trống")
    private List<String> deliveryMethods;
    
    private String locationText;
    
    private String status; // draft or active
}