package com.loopbook.be_api.controllers;

import com.loopbook.be_api.entities.Transaction;
import com.loopbook.be_api.entities.Wallet;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.TransactionService;
import com.loopbook.be_api.services.WalletService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(origins = "*", maxAge = 3600)
public class WalletController {

    private final WalletService walletService;
    private final JwtUtils jwtUtils;
    private final TransactionService transactionService;

    public WalletController(WalletService walletService, JwtUtils jwtUtils, TransactionService transactionService) {
        this.walletService = walletService;
        this.jwtUtils = jwtUtils;
        this.transactionService = transactionService;
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
            // make Wallet.topUp() create transaction
            Wallet wallet =
                    walletService.topUp(
                            userId,
                            amount);

            Transaction transaction =
                    new Transaction();

            transaction.setId(
                    UUID.randomUUID()
                            .toString());

            transaction.setBuyerId(userId);

            transaction.setType("topup");

            transaction.setAmount(
                    String.valueOf(amount));

            transaction.setStatus(
                    "completed");

            transaction.setPartner(
                    "LoopBook");

            transaction.setBook(
                    "Nạp tiền ví");

            transaction.setWhenTime(
                    LocalDateTime
                            .now()
                            .toString());

            transaction.setIsCompleted(
                    true);

            transaction.setCompletedAt(
                    LocalDateTime.now());

            transactionService
                    .create(transaction);
            return ResponseEntity.ok(wallet);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/topup-history")
    public ResponseEntity<?> history(
            @RequestHeader("Authorization")
            String authHeader) {

        UUID userId =
                jwtUtils
                        .extractUserIdFromToken(
                                authHeader);

        return ResponseEntity.ok(
                transactionService
                        .getTopupHistory(
                                userId));
    }
}