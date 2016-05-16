package com.altvil.netop.plan.fiber;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include=JsonTypeInfo.As.PROPERTY)
@JsonSubTypes({
	@JsonSubTypes.Type(value = NpvFiberPlanRequest.class, name="NPV"),
	@JsonSubTypes.Type(value = CapexFiberPlanRequest.class, name="CAPEX"),
	@JsonSubTypes.Type(value = CapexFiberPlanRequest.class, name="undefined")
})
public class AbstractFiberPlanRequest {
	private final String algorithm;
	private long						   planId;

	protected AbstractFiberPlanRequest(String algorithm) {
		this.algorithm = algorithm;
	}

	public String getAlgorithm() {
		return algorithm;
	}

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}
}
