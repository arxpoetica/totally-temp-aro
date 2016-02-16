package com.altvil.aro.rest.plan;

import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class FiberPlanRequest {

	private int planId;
	private FiberNetworkConstraints fiberNetworkConstraints;

	public int getPlanId() {
		return planId;
	}

	public void setPlanId(int planId) {
		this.planId = planId;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public void setFiberNetworkConstraints(
			FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

}
