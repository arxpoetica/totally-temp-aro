package com.altvil.aro.service.optimization.wirecenter.impl;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.aro.service.report.PlanAnalysisReport;

public class OptimizedPlanImpl implements OptimizedPlan {

	private GeneratedPlan generatedPlan;
	private PlanAnalysisReport planAnalysisReport;

	public OptimizedPlanImpl(GeneratedPlan generatedPlan,
			PlanAnalysisReport planAnalysisReport) {
		super();
		this.generatedPlan = generatedPlan;
		this.planAnalysisReport = planAnalysisReport;
	}

	@Override
	public long getPlanId() {
		return generatedPlan.getWirecenterNetworkPlan().getPlanId();
	}

	@Override
	public PlanAnalysisReport getPlanAnalysisReport() {
		return planAnalysisReport;
	}


	@Override
	public GeneratedPlan getGeneratedPlan() {
		return generatedPlan;
	}

}
