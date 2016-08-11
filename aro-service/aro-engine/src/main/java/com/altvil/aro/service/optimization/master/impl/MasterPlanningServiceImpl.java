package com.altvil.aro.service.optimization.master.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.master.GeneratedMasterPlan;
import com.altvil.aro.service.optimization.master.MasterPlanningService;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.report.PlanAnalysisReportService;

@Service
public class MasterPlanningServiceImpl implements MasterPlanningService {

	private NetworkReportService networkReportService;
	private PlanAnalysisReportService planAnalysisReportService;

	@Autowired
	public MasterPlanningServiceImpl(NetworkReportService networkReportService,
			PlanAnalysisReportService planAnalysisReportService) {
		super();
		this.networkReportService = networkReportService;
		this.planAnalysisReportService = planAnalysisReportService;
	}

	@Override

	public OptimizedMasterPlan createOptimizedMasterPlan(
			GeneratedMasterPlan plan) {

		return new OptimizedMasterPlanImpl(plan,
				planAnalysisReportService.aggregate(plan));
	}

	// TODO Add any extra information required

	@Override
	public OptimizedMasterPlan save(GeneratedMasterPlan generatedPlan) {

		OptimizedMasterPlan op = createOptimizedMasterPlan(generatedPlan);

		networkReportService.saveNetworkReport(op);

		return op;
	}

	@Override
	public OptimizedMasterPlan save(OptimizedMasterPlan op) {

		networkReportService.saveNetworkReport(op);

		return op;
	}

	private static class OptimizedMasterPlanImpl implements OptimizedMasterPlan {

		private PlanAnalysisReport planAnalysisReport;
		private GeneratedMasterPlan generatedMasterPlan;

		public OptimizedMasterPlanImpl(GeneratedMasterPlan generatedMasterPlan,
				PlanAnalysisReport planAnalysisReport) {
			super();
			this.planAnalysisReport = planAnalysisReport;
			this.generatedMasterPlan = generatedMasterPlan;
		}

		@Override
		public long getPlanId() {
			return generatedMasterPlan.getOptimizationRequest().getPlanId();
		}

		@Override
		public PlanAnalysisReport getPlanAnalysisReport() {
			return planAnalysisReport;
		}

		@Override
		public GeneratedMasterPlan getGeneratedMasterPlan() {
			return generatedMasterPlan;
		}
	}

}
