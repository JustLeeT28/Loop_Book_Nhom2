package com.loopbook.be_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loopbook.be_api.entities.PremiumPlan;

@Repository
public interface PremiumPlanRepository extends JpaRepository<PremiumPlan, String> {
}