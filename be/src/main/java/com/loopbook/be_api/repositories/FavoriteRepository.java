package com.loopbook.be_api.repositories;

import com.loopbook.be_api.entities.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, UUID> {
    Optional<Favorite> findByUserIdAndBookId(UUID userId, String bookId);
    List<Favorite> findByUserIdOrderByCreatedAtDesc(UUID userId);
    boolean existsByUserIdAndBookId(UUID userId, String bookId);
    void deleteByUserIdAndBookId(UUID userId, String bookId);
    int countByBookId(String bookId);
}