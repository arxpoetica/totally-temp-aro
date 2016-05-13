package com.altvil.netop.plan;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.network.PlanId;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.netop.json.NetworkAlgorithmDeserializer;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

public class FiberPlanRequest {
	private NetworkConfiguration.Algorithm algorithm;
	private double						   discountRate	= Double.NaN;
	private FiberNetworkConstraints		   fiberNetworkConstraints;
	private int							   periods		= -1;
	private PlanId						   planId;

	public NetworkConfiguration.Algorithm getAlgorithm() {
		return algorithm;
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public NetworkConfiguration getNetworkConfiguration() {
		return new NetworkConfiguration(getAlgorithm(), getDiscountRate(), getPeriods());
	}

	public int getPeriods() {
		return periods;
	}

	public PlanId getPlanId() {
		return planId;
	}

	@JsonDeserialize(using = NetworkAlgorithmDeserializer.class)
	public void setAlgorithm(NetworkConfiguration.Algorithm algorithm) {
		this.algorithm = algorithm;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setFiberNetworkConstraints(FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

	public void setPeriods(int periods) {
		this.periods = periods;
	}

	public void setPlanId(PlanId planId) {
		this.planId = planId;
	}
}
