package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

public abstract class AbstractOptimizationPlan extends AbstractFiberPlan implements FiberPlan {
	protected AbstractOptimizationPlan(FiberPlanAlgorithm algorithm) {
		super(algorithm);
	}
}
