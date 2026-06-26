package com.loopbook.be_api.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String name;
    private String phone;
    private String avatarUrl;
    private String bio;
    private String address;
}