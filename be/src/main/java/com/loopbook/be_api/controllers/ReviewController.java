package com.loopbook.be_api.controllers;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.entities.Review;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.ReviewService;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ReviewController {

    private final ReviewService reviewService;
    private final JwtUtils jwtUtils;

    public ReviewController(ReviewService reviewService, JwtUtils jwtUtils) {
        this.reviewService = reviewService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping
    public ResponseEntity<?> createReview(
            @RequestBody Map<String, Object> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            UUID revieweeId = UUID.fromString((String) body.get("revieweeId"));
            String bookId = (String) body.get("bookId");
            String transactionId = (String) body.get("transactionId");
            Integer rating = (Integer) body.get("rating");
            String content = (String) body.get("content");
            Boolean isAnonymous = (Boolean) body.get("isAnonymous");

            Review review = reviewService.createReview(
                userId, revieweeId, bookId, transactionId, rating, content, isAnonymous);
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/book/{bookId}")
    public ResponseEntity<?> getReviewsByBook(@PathVariable String bookId) {
        List<Review> reviews = reviewService.getReviewsByBook(bookId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/book/{bookId}/stats")
    public ResponseEntity<?> getBookReviewStats(@PathVariable String bookId) {
        Map<String, Object> stats = reviewService.getBookReviewStats(bookId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getReviewsByUser(@PathVariable UUID userId) {
        List<Review> reviews = reviewService.getReviewsByRevieweeWithBook(userId);
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<?> getUserReviewStats(@PathVariable UUID userId) {
        Map<String, Object> stats = reviewService.getUserReviewStats(userId);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyReviews(@RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            List<Review> reviews = reviewService.getReviewsByReviewer(userId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
