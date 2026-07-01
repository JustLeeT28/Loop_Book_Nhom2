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

    /**
     * Hold money from buyer's available balance into held_balance (escrow).
     * The money is deducted from available balance and added to held_balance.
     * It will be released to seller only when buyer confirms receipt.
     */
    @Transactional
    public Wallet holdMoney(UUID userId, int amount) {
        Wallet wallet = getWalletByUserId(userId);
        if (wallet.getBalance() < amount) {
            throw new RuntimeException("Insufficient balance to hold");
        }
        wallet.setBalance(wallet.getBalance() - amount);
        wallet.setHeldBalance(wallet.getHeldBalance() + amount);
        return walletRepository.save(wallet);
    }

    /**
     * Release held money to the seller's available balance.
     * Called when buyer confirms receipt of the book.
     */
    @Transactional
    public Wallet releaseHeldMoneyToSeller(UUID sellerId, int amount) {
        // This money comes from the buyer's held_balance held by the platform.
        // We add it directly to the seller's available balance.
        Wallet sellerWallet = getWalletByUserId(sellerId);
        sellerWallet.setBalance(sellerWallet.getBalance() + amount);
        sellerWallet.setTotalIn(sellerWallet.getTotalIn() + amount);
        return walletRepository.save(sellerWallet);
    }

    /**
     * Release held money back to the buyer's available balance.
     * Called when a transaction is refunded/cancelled before confirmation.
     */
    @Transactional
    public Wallet releaseHeldMoneyToBuyer(UUID buyerId, int amount) {
        Wallet buyerWallet = getWalletByUserId(buyerId);
        // Decrease held_balance of the buyer
        if (buyerWallet.getHeldBalance() < amount) {
            throw new RuntimeException("Insufficient held balance to release");
        }
        buyerWallet.setHeldBalance(buyerWallet.getHeldBalance() - amount);
        buyerWallet.setBalance(buyerWallet.getBalance() + amount);
        return walletRepository.save(buyerWallet);
    }
}
