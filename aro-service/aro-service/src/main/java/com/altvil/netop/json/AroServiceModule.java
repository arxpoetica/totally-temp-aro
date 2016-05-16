package com.altvil.netop.json;

import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.netop.json.mixin.FiberPlanAlgorithmMixin;
import com.altvil.netop.json.mixin.FiberPlanMixin;
import com.altvil.netop.json.mixin.OptimizationPlanMixin;
import com.fasterxml.jackson.databind.module.SimpleModule;

public class AroServiceModule extends SimpleModule {
	private static final long serialVersionUID = 1L;

	protected AroServiceModule() {
		super("FiberPlanModule");
	}

	@Override
	public void setupModule(SetupContext context) {
		context.setMixInAnnotations(FiberPlan.class, FiberPlanMixin.class);
		context.setMixInAnnotations(OptimizationPlan.class, OptimizationPlanMixin.class);
		context.setMixInAnnotations(FiberPlanAlgorithm.class, FiberPlanAlgorithmMixin.class);
	}
}
