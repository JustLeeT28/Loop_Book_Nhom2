package com.loopbook.be_api.repositories;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.Transaction;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);
    List<Transaction> findBySellerIdOrderByCreatedAtDesc(UUID sellerId);
    List<Transaction> findByBookId(String bookId);
}