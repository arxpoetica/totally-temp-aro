package com.altvil.aro.service.planning;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;

public interface FiberNetworkConstraintsBuilder {
		FiberNetworkConstraints build(FiberPlan fiberPlan);
}
