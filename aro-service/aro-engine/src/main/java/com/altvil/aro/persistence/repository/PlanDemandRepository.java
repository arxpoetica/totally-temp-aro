package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.altvil.aro.model.PlanDemand;

public interface PlanDemandRepository extends JpaRepository<PlanDemand, Long> {

}