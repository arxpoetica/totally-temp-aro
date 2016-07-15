package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.report.PlanAnalysisReport;

public class MasterOptimizationPlan {

	private MasterOptimizationRequest request;
	private Collection<OptimizedPlan> updates;
	private PlanAnalysisReport planAnalysisReport;

	public MasterOptimizationPlan(MasterOptimizationRequest request,
			Collection<OptimizedPlan> updates,
			PlanAnalysisReport planAnalysisReport) {
		this.updates = updates;
		this.request = request;
		this.planAnalysisReport = planAnalysisReport;
	}

	public Collection<OptimizedPlan> getUpdates() {
		return updates;
	}

	public long getPlanId() {
		return request.getPlanId();
	}

	public MasterOptimizationRequest getRequest() {
		return request;
	}

	public PlanAnalysisReport getPlanAnalysisReport() {
		return planAnalysisReport;
	}

}
