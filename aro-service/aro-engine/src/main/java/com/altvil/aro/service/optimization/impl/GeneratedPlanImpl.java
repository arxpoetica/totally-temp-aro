package com.altvil.aro.service.optimization.impl;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.report.GeneratedPlan;

public class GeneratedPlanImpl implements GeneratedPlan {

	private NetworkDemandSummary networkDemandSummary;
	private OptimizationConstraints optimizationConstraints;
	private WirecenterNetworkPlan wirecenterNetworkPlan;

	public GeneratedPlanImpl(NetworkDemandSummary networkDemandSummary,
			OptimizationConstraints optimizationConstraints,
			WirecenterNetworkPlan wirecenterNetworkPlan) {
		super();
		this.networkDemandSummary = networkDemandSummary;
		this.optimizationConstraints = optimizationConstraints;
		this.wirecenterNetworkPlan = wirecenterNetworkPlan;
	}

	@Override
	public NetworkDemandSummary getDemandSummary() {
		return networkDemandSummary;
	}

	@Override
	public OptimizationConstraints getOptimizationConstraints() {
		return optimizationConstraints;
	}

	@Override
	public WirecenterNetworkPlan getWirecenterNetworkPlan() {
		return wirecenterNetworkPlan;
	}

}