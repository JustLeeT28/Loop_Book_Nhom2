package com.loopbook.be_api.services;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.loopbook.be_api.entities.Category;
import com.loopbook.be_api.repositories.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<Category> getAll() {
        return categoryRepository.findAll();
    }

    public List<Category> getActive() {
        return categoryRepository.findActiveCategoriesOrderByOrder();
    }

    public Category getById(String id) {
        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy danh mục"));
    }

    public Category create(Category category) {

        category.setId(UUID.randomUUID().toString());

        if (category.getBooksCount() == null)
            category.setBooksCount(0);

        if (category.getOrder() == null)
            category.setOrder(0);

        if (category.getIsActive() == null)
            category.setIsActive(true);

        return categoryRepository.save(category);
    }

    public Category update(String id, Category request) {

        Category category = getById(id);

        category.setName(request.getName());
        category.setAccent(request.getAccent());
        category.setSlug(request.getSlug());
        category.setDescription(request.getDescription());
        category.setIcon(request.getIcon());
        category.setOrder(request.getOrder());

        return categoryRepository.save(category);
    }

    public void delete(String id) {
        categoryRepository.deleteById(id);
    }

    public Category toggleStatus(String id) {

        Category category = getById(id);

        category.setIsActive(!category.getIsActive());

        return categoryRepository.save(category);
    }
}