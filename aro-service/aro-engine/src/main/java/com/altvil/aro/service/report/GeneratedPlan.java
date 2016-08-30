package com.altvil.aro.service.report;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface GeneratedPlan {
	OptimizationConstraints getOptimizationConstraints();
	NetworkDemandSummary getDemandSummary();


	WirecenterNetworkPlan getWirecenterNetworkPlan();

}
