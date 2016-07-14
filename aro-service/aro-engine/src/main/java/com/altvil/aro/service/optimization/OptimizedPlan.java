package com.altvil.aro.service.optimization;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface OptimizedPlan {

	NetworkDemandSummary getDemandSummary() ;

	OptimizationConstraints getOptimizationConstraints();

	WirecenterNetworkPlan getWirecenterNetworkPlan();

}
