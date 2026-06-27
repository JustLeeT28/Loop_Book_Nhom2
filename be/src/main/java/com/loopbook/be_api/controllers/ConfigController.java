package com.loopbook.be_api.controllers;

import com.loopbook.be_api.services.ConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/config")
@CrossOrigin(origins = "*")
public class ConfigController {

    private final ConfigService configService;

    public ConfigController(ConfigService configService) {
        this.configService = configService;
    }

    @GetMapping("/conditions")
    public ResponseEntity<List<Map<String, String>>> getConditionOptions() {
        return ResponseEntity.ok(configService.getConditionOptions());
    }

    @GetMapping("/delivery-methods")
    public ResponseEntity<List<Map<String, String>>> getDeliveryOptions() {
        return ResponseEntity.ok(configService.getDeliveryOptions());
    }

    @GetMapping("/schools")
    public ResponseEntity<List<String>> getSchoolSuggestions() {
        return ResponseEntity.ok(configService.getSchoolSuggestions());
    }

    @GetMapping("/categories")
    public ResponseEntity<List<Map<String, Object>>> getCategories() {
        return ResponseEntity.ok(configService.getCategories());
    }
}