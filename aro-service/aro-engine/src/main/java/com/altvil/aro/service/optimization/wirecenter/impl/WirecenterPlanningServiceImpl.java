package com.altvil.aro.service.optimization.wirecenter.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReportService;

@Service
public class WirecenterPlanningServiceImpl implements WirecenterPlanningService {

	private NetworkNodeRepository networkNodeRepository;
	private FiberRouteRepository fiberRouteRepository;
	private NetworkReportService networkReportService;
	private PlanAnalysisReportService planAnalysisReportService;

	@Autowired
	public WirecenterPlanningServiceImpl(
			NetworkNodeRepository networkNodeRepository,
			FiberRouteRepository fiberRouteRepository,
			NetworkReportService networkReportService,
			PlanAnalysisReportService planAnalysisReportService) {
		super();
		this.networkNodeRepository = networkNodeRepository;
		this.fiberRouteRepository = fiberRouteRepository;
		this.networkReportService = networkReportService;
		this.planAnalysisReportService = planAnalysisReportService;
	}



	@Override
	public OptimizedPlan optimizedPlan(GeneratedPlan generatedPlan) {
		return new OptimizedPlanImpl(generatedPlan,
				planAnalysisReportService.createPlanAnalysisReport(generatedPlan));
	}

	@Override
	public OptimizedPlan save(GeneratedPlan plan) {
		networkNodeRepository.save(plan.getWirecenterNetworkPlan()
				.getNetworkNodes());
		fiberRouteRepository.save(plan.getWirecenterNetworkPlan()
				.getFiberRoutes());

		OptimizedPlan optimizedPlan = new OptimizedPlanImpl(plan,
				planAnalysisReportService.createPlanAnalysisReport(plan));

		networkReportService.saveNetworkReport(optimizedPlan);

		return optimizedPlan;

	}

	@Override
	public OptimizedPlan save(OptimizedPlan optimizedPlan) {
		final WirecenterNetworkPlan wirecenterNetworkPlan = optimizedPlan.getGeneratedPlan().getWirecenterNetworkPlan();

		networkNodeRepository.save(wirecenterNetworkPlan.getNetworkNodes());
		fiberRouteRepository.save(wirecenterNetworkPlan.getFiberRoutes());

		networkReportService.saveNetworkReport(optimizedPlan);

		return optimizedPlan;
	}
}
