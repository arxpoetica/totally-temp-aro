package com.altvil.aro.persistence.repository;

import com.altvil.aro.model.NetworkPlanData;
import com.altvil.aro.model.NetworkPlanDataKey;
import com.altvil.aro.model.PlanLocationLink;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlanLocationLinkRepository extends JpaRepository<PlanLocationLink, Long> {
}
