package com.altvil.aro.service.planning.fiber;

import com.altvil.enumerations.FiberPlanAlgorithm;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include=JsonTypeInfo.As.PROPERTY)
@JsonSubTypes({
	@JsonSubTypes.Type(value = NpvFiberPlan.class, name="NPV"),
	@JsonSubTypes.Type(value = ScalarFiberPlan.class, name="CAPEX"),
	@JsonSubTypes.Type(value = ScalarFiberPlan.class, name="undefined")
})
public abstract class AbstractFiberPlan implements Cloneable {
	private final FiberPlanAlgorithm algorithm;
	private long						   planId;
	private int year;

	protected AbstractFiberPlan(FiberPlanAlgorithm algorithm) {
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

	public int getYear() {
		return year;
	}

	public void setYear(int year) {
		this.year = year;
	}
	
	public final <T extends AbstractFiberPlan> T dependentFiberPlan(long planId) {
		try {
			@SuppressWarnings("unchecked")
			T copy = (T) this.clone();
			copy.setPlanId(planId);
			return copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	};
}
