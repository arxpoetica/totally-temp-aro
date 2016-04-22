package com.altvil.netop.plan;

import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class FiberPlanRequest {
	private long					planId;
	private FiberNetworkConstraints	fiberNetworkConstraints;
	private String					algorithm;

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public void setFiberNetworkConstraints(FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

	public String getAlgorithm() {
		return algorithm;
	}

	public void setAlgorithm(String algorithm) {
		this.algorithm = algorithm;
	}

}
