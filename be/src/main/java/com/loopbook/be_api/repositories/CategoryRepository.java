package com.loopbook.be_api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.Category;

@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {
    @Query("SELECT c FROM Category c WHERE c.isActive = true ORDER BY c.order ASC")
    List<Category> findActiveCategoriesOrderByOrder();
}
