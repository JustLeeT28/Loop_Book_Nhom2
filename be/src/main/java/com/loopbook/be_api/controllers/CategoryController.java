package com.loopbook.be_api.controllers;

import com.loopbook.be_api.entities.Category;
import com.loopbook.be_api.services.CategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(
            CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<Category>> getAll() {
        return ResponseEntity.ok(
                categoryService.getAll());
    }

    @GetMapping("/active")
    public ResponseEntity<List<Category>> getActive() {
        return ResponseEntity.ok(
                categoryService.getActive());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Category> getById(
            @PathVariable String id) {

        return ResponseEntity.ok(
                categoryService.getById(id));
    }

    @PostMapping
    public ResponseEntity<Category> create(
            @RequestBody Category category) {

        return ResponseEntity.ok(
                categoryService.create(category));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Category> update(
            @PathVariable String id,
            @RequestBody Category category) {

        return ResponseEntity.ok(
                categoryService.update(id, category));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable String id) {

        categoryService.delete(id);

        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Category> toggle(
            @PathVariable String id) {

        return ResponseEntity.ok(
                categoryService.toggleStatus(id));
    }
}