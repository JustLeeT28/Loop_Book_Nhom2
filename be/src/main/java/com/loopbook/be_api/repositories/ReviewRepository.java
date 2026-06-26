package com.loopbook.be_api.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.Review;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByBookIdOrderByCreatedAtDesc(String bookId);
    List<Review> findByReviewerIdOrderByCreatedAtDesc(UUID reviewerId);
    List<Review> findByRevieweeIdOrderByCreatedAtDesc(UUID revieweeId);
    Optional<Review> findByTransactionId(String transactionId);
    
    int countByBookId(String bookId);
    int countByRevieweeId(UUID revieweeId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.bookId = :bookId")
    double averageRatingByBookId(@Param("bookId") String bookId);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM Review r WHERE r.revieweeId = :revieweeId")
    double averageRatingByRevieweeId(@Param("revieweeId") UUID revieweeId);
}
