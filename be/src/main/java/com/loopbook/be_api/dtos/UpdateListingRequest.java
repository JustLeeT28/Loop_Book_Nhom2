package com.loopbook.be_api.dtos;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateListingRequest {
    private String title;
    
    private String description;
    
    private BigDecimal price;
    
    private List<String> images;
    
    private String condition;
    
    private Boolean allowOffers;
    
    private List<String> deliveryMethods;
    
    private String locationText;
    
    private String status;
}