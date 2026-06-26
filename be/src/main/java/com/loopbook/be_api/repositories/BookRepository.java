package com.loopbook.be_api.repositories;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.Book;

@Repository
public interface BookRepository extends JpaRepository<Book, String> {
    Page<Book> findBySellerIdOrderByCreatedAtDesc(UUID sellerId, Pageable pageable);
    
    Page<Book> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    
    Page<Book> findByStatusAndCategoryOrderByCreatedAtDesc(String status, String category, Pageable pageable);
    
    Page<Book> findByStatusAndSchoolOrderByCreatedAtDesc(String status, String school, Pageable pageable);
    
    Page<Book> findByStatusAndCategoryAndSchoolOrderByCreatedAtDesc(String status, String category, String school, Pageable pageable);
    
    List<Book> findBySellerIdAndStatus(UUID sellerId, String status);
    
    Page<Book> findAll(Pageable pageable);
    
    Optional<Book> findByIdAndSellerId(String bookId, UUID sellerId);
}
