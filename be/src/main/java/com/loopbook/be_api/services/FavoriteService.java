package com.loopbook.be_api.services;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.loopbook.be_api.entities.Favorite;
import com.loopbook.be_api.repositories.FavoriteRepository;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public FavoriteService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    @Transactional
    public Map<String, Object> toggleFavorite(UUID userId, String bookId) {
        var existing = favoriteRepository.findByUserIdAndBookId(userId, bookId);
        if (existing.isPresent()) {
            favoriteRepository.delete(existing.get());
            int count = favoriteRepository.countByBookId(bookId);
            return Map.of("favorited", false, "favoriteCount", count);
        } else {
            Favorite fav = new Favorite();
            fav.setUserId(userId);
            fav.setBookId(bookId);
            favoriteRepository.save(fav);
            int count = favoriteRepository.countByBookId(bookId);
            return Map.of("favorited", true, "favoriteCount", count);
        }
    }

    public boolean isFavorited(UUID userId, String bookId) {
        return favoriteRepository.existsByUserIdAndBookId(userId, bookId);
    }

    public List<Favorite> getUserFavorites(UUID userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public int getFavoriteCount(String bookId) {
        return favoriteRepository.countByBookId(bookId);
    }
}