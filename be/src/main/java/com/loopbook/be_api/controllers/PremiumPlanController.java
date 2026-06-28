package com.loopbook.be_api.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loopbook.be_api.entities.PremiumPlan;
import com.loopbook.be_api.services.PremiumPlanService;
import com.loopbook.be_api.services.TransactionService;

@RestController
@RequestMapping("/api/premium-plans")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PremiumPlanController {

    private final PremiumPlanService premiumPlanService;
    private final TransactionService transactionService;

    public PremiumPlanController(PremiumPlanService premiumPlanService, TransactionService transactionService) {
        this.premiumPlanService = premiumPlanService;
        this.transactionService = transactionService;
    }

    @GetMapping
    public ResponseEntity<List<PremiumPlan>> getAll() {
        return ResponseEntity.ok(premiumPlanService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PremiumPlan> getById(@PathVariable String id) {
        return ResponseEntity.ok(premiumPlanService.getById(id));
    }
}