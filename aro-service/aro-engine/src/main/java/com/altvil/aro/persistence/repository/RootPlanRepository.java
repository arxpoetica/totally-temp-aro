package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.RootPlan;

@Repository()
public interface RootPlanRepository extends JpaRepository<RootPlan, Long> {

}
