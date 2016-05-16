package com.altvil.aro.service.planning.optimization;

import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include=JsonTypeInfo.As.PROPERTY)
@JsonSubTypes({
	@JsonSubTypes.Type(value = NpvOptimizationPlan.class, name="NPV"),
	@JsonSubTypes.Type(value = CapexOptimizationPlan.class, name="CAPEX"),
	@JsonSubTypes.Type(value = CapexOptimizationPlan.class, name="undefined")
})
public abstract class AbstractOptimizationPlan extends AbstractFiberPlan implements FiberPlan {
	protected AbstractOptimizationPlan(FiberPlanAlgorithm algorithm) {
		super(algorithm);
	}	
}
