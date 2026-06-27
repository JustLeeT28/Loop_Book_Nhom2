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
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.entities.Favorite;
import com.loopbook.be_api.security.JwtUtils;
import com.loopbook.be_api.services.FavoriteService;

@RestController
@RequestMapping("/api/favorites")
@CrossOrigin(origins = "*", maxAge = 3600)
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final JwtUtils jwtUtils;

    public FavoriteController(FavoriteService favoriteService, JwtUtils jwtUtils) {
        this.favoriteService = favoriteService;
        this.jwtUtils = jwtUtils;
    }

    @PostMapping("/toggle/{bookId}")
    public ResponseEntity<?> toggleFavorite(
            @PathVariable String bookId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            Map<String, Object> result = favoriteService.toggleFavorite(userId, bookId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/check/{bookId}")
    public ResponseEntity<?> checkFavorited(
            @PathVariable String bookId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            boolean favorited = favoriteService.isFavorited(userId, bookId);
            return ResponseEntity.ok(Map.of("favorited", favorited));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<?> getUserFavorites(
            @RequestHeader("Authorization") String authHeader) {
        try {
            UUID userId = jwtUtils.extractUserIdFromToken(authHeader);
            List<Favorite> favorites = favoriteService.getUserFavorites(userId);
            return ResponseEntity.ok(favorites);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/count/{bookId}")
    public ResponseEntity<?> getFavoriteCount(@PathVariable String bookId) {
        int count = favoriteService.getFavoriteCount(bookId);
        return ResponseEntity.ok(Map.of("favoriteCount", count));
    }
}