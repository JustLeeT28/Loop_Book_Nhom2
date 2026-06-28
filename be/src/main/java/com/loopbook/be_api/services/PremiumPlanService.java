package com.loopbook.be_api.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.loopbook.be_api.entities.PremiumPlan;
import com.loopbook.be_api.repositories.PremiumPlanRepository;

@Service
public class PremiumPlanService {

    private final PremiumPlanRepository premiumPlanRepository;

    public PremiumPlanService(PremiumPlanRepository premiumPlanRepository) {
        this.premiumPlanRepository = premiumPlanRepository;
    }

    public List<PremiumPlan> getAll() {
        return premiumPlanRepository.findAll();
    }

    public PremiumPlan getById(String id) {
        return premiumPlanRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Không tìm thấy gói dịch vụ: " + id));
    }
}