package com.loopbook.be_api.services;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopbook.be_api.entities.Review;
import com.loopbook.be_api.repositories.ReviewRepository;

@Service
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public ReviewService(ReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @Transactional
    public Review createReview(UUID reviewerId, UUID revieweeId, String bookId,
                                String transactionId, Integer rating, String content, Boolean isAnonymous) {
        Review review = new Review();
        review.setReviewerId(reviewerId);
        review.setRevieweeId(revieweeId);
        review.setBookId(bookId);
        review.setTransactionId(transactionId);
        review.setRating(rating);
        review.setContent(content);
        review.setIsAnonymous(isAnonymous != null ? isAnonymous : false);
        return reviewRepository.save(review);
    }

    public List<Review> getReviewsByBook(String bookId) {
        return reviewRepository.findByBookIdOrderByCreatedAtDesc(bookId);
    }

    public List<Review> getReviewsByReviewer(UUID reviewerId) {
        return reviewRepository.findByReviewerIdOrderByCreatedAtDesc(reviewerId);
    }

    public List<Review> getReviewsByReviewee(UUID revieweeId) {
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(revieweeId);
    }

    public Map<String, Object> getBookReviewStats(String bookId) {
        int count = reviewRepository.countByBookId(bookId);
        double avgRating = reviewRepository.averageRatingByBookId(bookId);
        return Map.of("reviewCount", count, "averageRating", Math.round(avgRating * 10.0) / 10.0);
    }

    public List<Review> getReviewsByRevieweeWithBook(UUID revieweeId) {
        return reviewRepository.findByRevieweeIdOrderByCreatedAtDesc(revieweeId);
    }

    public Map<String, Object> getUserReviewStats(UUID userId) {
        int count = reviewRepository.countByRevieweeId(userId);
        double avgRating = reviewRepository.averageRatingByRevieweeId(userId);
        return Map.of("reviewCount", count, "averageRating", Math.round(avgRating * 10.0) / 10.0);
    }
}
