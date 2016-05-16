package com.altvil.aro.service.planning;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.fiber.AbstractFiberPlan;

public interface FiberNetworkConstraintsBuilder {
		FiberNetworkConstraints build(AbstractFiberPlan fiberPlan);
}
