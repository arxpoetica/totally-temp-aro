package com.altvil.netop.plan;

import com.altvil.aro.service.plan.FiberNetworkConstraints;

public class FiberPlanRequest {

	private long planId;
	private FiberNetworkConstraints fiberNetworkConstraints;

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
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
