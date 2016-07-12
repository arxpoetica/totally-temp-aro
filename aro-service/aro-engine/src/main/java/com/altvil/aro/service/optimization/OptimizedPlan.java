package com.altvil.aro.service.optimization;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface OptimizedPlan {

	LocationDemand getGlobalDemand();

	OptimizationConstraints getOptimizationConstraints();

	WirecenterNetworkPlan getWirecenterNetworkPlan();

}
