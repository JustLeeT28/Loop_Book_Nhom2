package com.loopbook.be_api.controllers;

import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.entities.Wallet;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.WalletService;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WalletController {

    private final WalletService walletService;
    private final JwtUtils jwtUtils;

    public WalletController(WalletService walletService, JwtUtils jwtUtils) {
        this.walletService = walletService;
        this.jwtUtils = jwtUtils;
    }

    @GetMapping
    public ResponseEntity<?> getWallet(@RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            Wallet wallet = walletService.getWalletByUserId(userId);
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/topup")
    public ResponseEntity<?> topUp(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            int amount = ((Number) body.get("amount")).intValue();
            Wallet wallet = walletService.topUp(userId, amount);
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}