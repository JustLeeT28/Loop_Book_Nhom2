package com.loopbook.be_api.repositories;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, String>, JpaSpecificationExecutor<Book> {
    Page<Book> findBySellerIdOrderByCreatedAtDesc(UUID sellerId, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE b.status = :status ORDER BY CASE WHEN b.boostExpiry > :now THEN 0 ELSE 1 END, b.createdAt DESC")
    Page<Book> findByStatusOrderByBoostAndCreatedAtDesc(@Param("status") String status, @Param("now") LocalDateTime now, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE b.status = :status AND b.category = :category ORDER BY CASE WHEN b.boostExpiry > :now THEN 0 ELSE 1 END, b.createdAt DESC")
    Page<Book> findByStatusAndCategoryOrderByBoostAndCreatedAtDesc(@Param("status") String status, @Param("category") String category, @Param("now") LocalDateTime now, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE b.status = :status AND b.school = :school ORDER BY CASE WHEN b.boostExpiry > :now THEN 0 ELSE 1 END, b.createdAt DESC")
    Page<Book> findByStatusAndSchoolOrderByBoostAndCreatedAtDesc(@Param("status") String status, @Param("school") String school, @Param("now") LocalDateTime now, Pageable pageable);
    
    @Query("SELECT b FROM Book b WHERE b.status = :status AND b.category = :category AND b.school = :school ORDER BY CASE WHEN b.boostExpiry > :now THEN 0 ELSE 1 END, b.createdAt DESC")
    Page<Book> findByStatusAndCategoryAndSchoolOrderByBoostAndCreatedAtDesc(@Param("status") String status, @Param("category") String category, @Param("school") String school, @Param("now") LocalDateTime now, Pageable pageable);

    Page<Book> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    Page<Book> findByStatusAndCategoryOrderByCreatedAtDesc(String status, String category, Pageable pageable);
    Page<Book> findByStatusAndSchoolOrderByCreatedAtDesc(String status, String school, Pageable pageable);
    Page<Book> findByStatusAndCategoryAndSchoolOrderByCreatedAtDesc(String status, String category, String school, Pageable pageable);

    List<Book> findBySellerIdAndStatus(UUID sellerId, String status);
    Page<Book> findAll(Pageable pageable);
    Optional<Book> findByIdAndSellerId(String bookId, UUID sellerId);
    List<Book> findByStatus(String status);
    long countByStatus(String status);
}