package com.loopbook.be_api.repositories;

import com.loopbook.be_api.entities.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {
    List<Transaction> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    List<Transaction> findBySellerIdOrderByCreatedAtDesc(UUID sellerId);

    List<Transaction> findByBookId(String bookId);

    List<Transaction> findByStatus(String status);

    List<Transaction> findByType(String type);

    List<Transaction> findByStatusAndType(
            String status,
            String type);

    List<Transaction>
    findByBuyerIdAndTypeOrderByCreatedAtDesc(
            UUID buyerId,
            String type);
    long countByStatus(String status);
}