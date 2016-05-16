package com.altvil.netop.plan.fiber;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.annotation.JsonTypeIdResolver;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.netop.json.FiberPlanRequestTypeIdResolver;

@JsonTypeInfo(use = JsonTypeInfo.Id.CUSTOM, include=JsonTypeInfo.As.PROPERTY, property="algorithm")
@JsonTypeIdResolver(FiberPlanRequestTypeIdResolver.class)
@Deprecated
public class AbstractFiberPlanRequest {
	private final FiberPlanAlgorithm algorithm;
	private long						   planId;

	protected AbstractFiberPlanRequest(FiberPlanAlgorithm algorithm) {
		this.algorithm = algorithm;
	}

	public FiberPlanAlgorithm getAlgorithm() {
		return algorithm;
	}

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}
}
