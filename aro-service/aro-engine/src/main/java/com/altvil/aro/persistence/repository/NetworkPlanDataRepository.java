package com.altvil.aro.persistence.repository;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkPlanData;
import com.altvil.aro.model.NetworkPlanDataKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NetworkPlanDataRepository  extends JpaRepository<NetworkPlanData, NetworkPlanDataKey> {
}
