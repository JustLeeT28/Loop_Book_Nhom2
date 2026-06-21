package com.loopbook.be_api.services;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopbook.be_api.dtos.UpdateProfileRequest;
import com.loopbook.be_api.dtos.UserProfileResponse;
import com.loopbook.be_api.entities.User;
import com.loopbook.be_api.repositories.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileResponse getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getAddress() != null) user.setAddress(request.getAddress());

        User updated = userRepository.save(user);
        return mapToResponse(updated);
    }

    private UserProfileResponse mapToResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .bio(user.getBio())
                .address(user.getAddress())
                .status(user.getStatus())
                .role(user.getRole())
                .rating(user.getRating())
                .responseTime(user.getResponseTime())
                .walletBalance(user.getWalletBalance())
                .totalIncome(user.getTotalIncome())
                .totalWithdrawn(user.getTotalWithdrawn())
                .listingsCount(user.getListingsCount())
                .salesCount(user.getSalesCount())
                .joinDate(user.getJoinDate())
                .createdAt(user.getCreatedAt())
                .build();
    }
}