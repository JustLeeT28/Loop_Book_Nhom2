package com.loopbook.be_api.controllers;

import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.dtos.CreateListingRequest;
import com.loopbook.be_api.dtos.ListingResponse;
import com.loopbook.be_api.dtos.UpdateListingRequest;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.BookService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/listings")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BookController {

    private final BookService bookService;
    private final JwtUtils jwtUtils;

    public BookController(BookService bookService, JwtUtils jwtUtils) {
        this.bookService = bookService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping
    public ResponseEntity<?> createListing(
            @Valid @RequestBody CreateListingRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            ListingResponse response = bookService.createListing(request, userId);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{bookId}")
    public ResponseEntity<?> updateListing(
            @PathVariable String bookId,
            @RequestBody UpdateListingRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            ListingResponse response = bookService.updateListing(bookId, request, userId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{bookId}")
    public ResponseEntity<?> deleteListing(
            @PathVariable String bookId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            bookService.deleteListing(bookId, userId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{bookId}")
    public ResponseEntity<?> getListingById(@PathVariable String bookId) {
        try {
            ListingResponse response = bookService.getListingById(bookId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<Page<ListingResponse>> getListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String school,
            @RequestParam(required = false) Integer minPrice,
            @RequestParam(required = false) Integer maxPrice,
            @RequestParam(required = false) String sort) {
        Sort sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null) {
            switch (sort) {
                case "price_asc":
                    sortObj = Sort.by(Sort.Direction.ASC, "price");
                    break;
                case "price_desc":
                    sortObj = Sort.by(Sort.Direction.DESC, "price");
                    break;
                case "newest":
                    sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
                    break;
                case "oldest":
                    sortObj = Sort.by(Sort.Direction.ASC, "createdAt");
                    break;
                case "title_asc":
                    sortObj = Sort.by(Sort.Direction.ASC, "title");
                    break;
                case "title_desc":
                    sortObj = Sort.by(Sort.Direction.DESC, "title");
                    break;
                default:
                    sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
                    break;
            }
        }
        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<ListingResponse> listings = bookService.getListings(
                pageable, status, category, school, minPrice, maxPrice, sort);
        return ResponseEntity.ok(listings);
    }

    @GetMapping("/user/my-listings")
    public ResponseEntity<?> getUserListings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            Pageable pageable = PageRequest.of(page, size);
            Page<ListingResponse> listings = bookService.getUserListings(userId, pageable);
            return ResponseEntity.ok(listings);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<Page<ListingResponse>> getListingsByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ListingResponse> listings = bookService.getListingsByStatus(status, pageable);
        return ResponseEntity.ok(listings);
    }
    
    @PostMapping("/{bookId}/boost")
    public ResponseEntity<?> boostListing(
            @PathVariable String bookId,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            String planId = body.get("planId");
            if (planId == null || planId.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "error", "planId là bắt buộc"));
            }
            ListingResponse response = bookService.boostListing(bookId, userId, planId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", response,
                "message", "Đã kích hoạt gói dịch vụ thành công!"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Admin endpoints
    @PutMapping("/{bookId}/status/{status}")
    public ResponseEntity<?> updateListingStatus(
            @PathVariable String bookId,
            @PathVariable String status,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Check if user is admin (should validate role in a real app)
            jwtUtils.extractUserIdFromToken(authHeader);
            ListingResponse response = bookService.updateListingStatus(bookId, status);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{bookId}/reject")
    public ResponseEntity<?> rejectListing(
            @PathVariable String bookId,
            @RequestParam String reason,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Check if user is admin (should validate role in a real app)
            jwtUtils.extractUserIdFromToken(authHeader);
            ListingResponse response = bookService.rejectListing(bookId, reason);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/admin/pending")
    public ResponseEntity<?> getPendingListings(
            @RequestHeader("Authorization") String authHeader) {

        try {

            // kiểm tra role admin
            jwtUtils.extractUserIdFromToken(authHeader);

            return ResponseEntity.ok(
                    bookService.getPendingListings());

        } catch (Exception e) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}