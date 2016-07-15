package com.altvil.aro.service.report;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public interface GeneratedPlan {
	NetworkDemandSummary getDemandSummary();

	OptimizationConstraints getOptimizationConstraints();

	WirecenterNetworkPlan getWirecenterNetworkPlan();

}
