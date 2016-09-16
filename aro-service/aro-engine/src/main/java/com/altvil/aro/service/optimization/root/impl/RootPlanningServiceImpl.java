package com.altvil.aro.service.optimization.root.impl;

import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.root.GeneratedRootPlan;
import com.altvil.aro.service.optimization.root.OptimizedRootPlan;
import com.altvil.aro.service.optimization.root.RootPlanningService;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.report.PlanAnalysisReportService;
import com.altvil.aro.service.report.SummarizedPlan;

@Service
public class RootPlanningServiceImpl implements RootPlanningService {

	private NetworkReportService networkReportService;
	private PlanAnalysisReportService planAnalysisReportService;
	
	@Autowired
	public RootPlanningServiceImpl(NetworkReportService networkReportService,
			PlanAnalysisReportService planAnalysisReportService) {
		super();
		this.networkReportService = networkReportService;
		this.planAnalysisReportService = planAnalysisReportService;
	}

	@Override
	public OptimizedRootPlan save(GeneratedRootPlan plan) {
		OptimizedRootPlan op = createOptimizedPlan(plan);

		networkReportService.saveNetworkReport(op);

		return op;

	}

	@Override
	public OptimizedRootPlan createOptimizedPlan(
			GeneratedRootPlan plan) {
		return new OptimizedRootPlanImpl(plan,
				planAnalysisReportService.aggregate(
						plan.getOptimizationRequest()
								.getOptimizationConstraints(),
						plan.getOptimizedPlans().stream()
								.map(SummarizedPlan::getPlanAnalysisReport)
								.filter(p -> p!=null)
								.collect(Collectors.toList())));

	}

	@Override
	public OptimizedRootPlan save(OptimizedRootPlan op) {
		networkReportService.saveNetworkReport(op);
		return op;
	}
	
	
	private static class OptimizedRootPlanImpl implements OptimizedRootPlan {

		private PlanAnalysisReport planAnalysisReport;
		private GeneratedRootPlan generatedPlan;

		public OptimizedRootPlanImpl(GeneratedRootPlan generatedMasterPlan,
				PlanAnalysisReport planAnalysisReport) {
			super();
			this.planAnalysisReport = planAnalysisReport;
			this.generatedPlan = generatedMasterPlan;
		}

		@Override
		public long getPlanId() {
			return generatedPlan.getOptimizationRequest().getPlanId();
		}

		@Override
		public PlanAnalysisReport getPlanAnalysisReport() {
			return planAnalysisReport;
		}

		@Override
		public GeneratedRootPlan getGeneratedRootPlan() {
			return generatedPlan;
		}
	}

}
