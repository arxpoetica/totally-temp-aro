package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public class OptimizedWirecenter {

	private WirecenterOptimizationRequest wirecenterOptimizationRequest;
	private WirecenterNetworkPlan plan;

	public OptimizedWirecenter(
			WirecenterOptimizationRequest wirecenterOptimizationRequest,
			WirecenterNetworkPlan plan) {
		super();
		this.wirecenterOptimizationRequest = wirecenterOptimizationRequest;
		this.plan = plan;
	}

	public WirecenterOptimizationRequest getWirecenterOptimizationRequest() {
		return wirecenterOptimizationRequest;
	}

	public WirecenterNetworkPlan getPlan() {
		return plan;
	}

}
