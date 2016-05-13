package com.altvil.netop.optimize;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.network.PlanId;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.netop.json.NetworkAlgorithmDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class OptimizationPlanRequest {
	private PlanId planId;
	private FiberNetworkConstraints fiberNetworkConstraints;
	private OptimizationInputs optimizationInputs = OptimizationInputs.DEFAULT ;
	private NetworkConfiguration.Algorithm algorithm ;
	private double discountRate = Double.NaN;
	private int periods = -1;

	public double getDiscountRate() {
		return discountRate;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public int getPeriods() {
		return periods;
	}

	public void setPeriods(int periods) {
		this.periods = periods;
	}

	public PlanId getPlanId() {
		return planId;
	}

	public void setPlanId(PlanId planId) {
		this.planId = planId;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public void setFiberNetworkConstraints(
			FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}


	public NetworkConfiguration.Algorithm getAlgorithm() {
		return algorithm;
	}

	@JsonDeserialize(using=NetworkAlgorithmDeserializer.class)
	public void setAlgorithm(NetworkConfiguration.Algorithm algorithm) {
		this.algorithm = algorithm;
	}

	public OptimizationInputs getOptimizationInputs() {
		return optimizationInputs;
	}

	public void setOptimizationInputs(OptimizationInputs optimizationInputs) {
		this.optimizationInputs = optimizationInputs;
	}

	public NetworkConfiguration getNetworkConfiguration() {
		return new NetworkConfiguration(getAlgorithm(), getDiscountRate(), getPeriods());
	}
}
