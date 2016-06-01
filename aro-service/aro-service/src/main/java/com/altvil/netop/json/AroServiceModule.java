package com.altvil.netop.json;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.enumerations.OptimizationType;
import com.altvil.netop.json.mixin.FiberNetworkConstraintsMixin;
import com.altvil.netop.json.mixin.FiberPlanAlgorithmMixin;
import com.altvil.netop.json.mixin.FiberPlanMixin;
import com.altvil.netop.json.mixin.OptimizationPlanMixin;
import com.altvil.netop.json.mixin.OptimizationTypeMixin;
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
		context.setMixInAnnotations(OptimizationType.class, OptimizationTypeMixin.class);
		context.setMixInAnnotations(FiberNetworkConstraints.class, FiberNetworkConstraintsMixin.class);
	}
}
