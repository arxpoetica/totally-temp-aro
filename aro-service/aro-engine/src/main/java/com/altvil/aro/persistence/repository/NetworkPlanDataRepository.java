package com.altvil.aro.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.altvil.aro.model.NetworkPlanData;
import com.altvil.aro.model.NetworkPlanDataKey;

@Repository
public interface NetworkPlanDataRepository  extends JpaRepository<NetworkPlanData, NetworkPlanDataKey> {
}
