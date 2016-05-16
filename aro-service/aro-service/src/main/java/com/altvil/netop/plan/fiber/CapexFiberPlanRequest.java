package com.altvil.netop.plan.fiber;

import com.altvil.enumerations.FiberPlanAlgorithm;

@Deprecated
public class CapexFiberPlanRequest extends AbstractFiberPlanRequest {
	protected CapexFiberPlanRequest() {
		super(FiberPlanAlgorithm.CAPEX);
	}
}
