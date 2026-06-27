package com.loopbook.be_api.services;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopbook.be_api.entities.Wallet;
import com.loopbook.be_api.repositories.WalletRepository;

@Service
public class WalletService {

    private final WalletRepository walletRepository;

    public WalletService(WalletRepository walletRepository) {
        this.walletRepository = walletRepository;
    }

    public Wallet getWalletByUserId(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Wallet not found for user: " + userId));
    }

    @Transactional
    public Wallet topUp(UUID userId, int amount) {
        Wallet wallet = getWalletByUserId(userId);
        wallet.setBalance(wallet.getBalance() + amount);
        wallet.setTotalIn(wallet.getTotalIn() + amount);
        return walletRepository.save(wallet);
    }

    @Transactional
    public Wallet deduct(UUID userId, int amount) {
        Wallet wallet = getWalletByUserId(userId);
        if (wallet.getBalance() < amount) {
            throw new RuntimeException("Insufficient balance");
        }
        wallet.setBalance(wallet.getBalance() - amount);
        wallet.setTotalOut(wallet.getTotalOut() + amount);
        return walletRepository.save(wallet);
    }
}