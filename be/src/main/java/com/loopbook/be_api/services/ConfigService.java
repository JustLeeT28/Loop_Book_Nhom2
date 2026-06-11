package com.loopbook.be_api.services;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.loopbook.be_api.entities.Category;
import com.loopbook.be_api.entities.Setting;
import com.loopbook.be_api.repositories.CategoryRepository;
import com.loopbook.be_api.repositories.SettingRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ConfigService {
    
    private final SettingRepository settingRepository;
    private final CategoryRepository categoryRepository;
    private final ObjectMapper objectMapper;
    
    public ConfigService(SettingRepository settingRepository, 
                        CategoryRepository categoryRepository,
                        ObjectMapper objectMapper) {
        this.settingRepository = settingRepository;
        this.categoryRepository = categoryRepository;
        this.objectMapper = objectMapper;
    }
    
    public List<Map<String, String>> getConditionOptions() {
        return getSettingAsListOfMaps("condition_options");
    }
    
    public List<Map<String, String>> getDeliveryOptions() {
        return getSettingAsListOfMaps("delivery_options");
    }
    
    public List<String> getSchoolSuggestions() {
        Optional<Setting> setting = settingRepository.findByKey("school_suggestions");
        if (setting.isEmpty()) {
            return Collections.emptyList();
        }
        
        try {
            return objectMapper.readValue(
                setting.get().getValue(), 
                new TypeReference<List<String>>() {}
            );
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }
    
    public List<Map<String, Object>> getCategories() {
        List<Category> categories = categoryRepository.findByIsActiveTrueOrderByOrderAsc();
        return categories.stream()
            .map(this::mapCategoryToMap)
            .collect(Collectors.toList());
    }
    
    private List<Map<String, String>> getSettingAsListOfMaps(String key) {
        Optional<Setting> setting = settingRepository.findByKey(key);
        if (setting.isEmpty()) {
            return Collections.emptyList();
        }
        
        try {
            return objectMapper.readValue(
                setting.get().getValue(), 
                new TypeReference<List<Map<String, String>>>() {}
            );
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }
    
    private Map<String, Object> mapCategoryToMap(Category category) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", category.getId());
        map.put("name", category.getName());
        map.put("accent", category.getAccent());
        if (category.getSlug() != null) {
            map.put("slug", category.getSlug());
        }
        if (category.getDescription() != null) {
            map.put("description", category.getDescription());
        }
        return map;
    }
}