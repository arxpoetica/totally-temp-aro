package com.altvil.aro.service.optimization.wirecenter.impl;

import org.eclipse.jetty.util.log.Log;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReportService;

@Service
public class WirecenterPlanningServiceImpl implements WirecenterPlanningService {
	
	private static final Logger log = LoggerFactory
			.getLogger(WirecenterPlanningServiceImpl.class.getName());


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
	public OptimizedPlan summarize(GeneratedPlan generatedPlan) {
		return new OptimizedPlanImpl(generatedPlan,
				planAnalysisReportService.createPlanAnalysisReport(generatedPlan));
	}

	@Override
	public void save(GeneratedPlan plan) {
		
		log.info("Equipment save .... " + plan.getWirecenterNetworkPlan().getPlanId()) ;
		
		networkNodeRepository.save(plan.getWirecenterNetworkPlan()
				.getNetworkNodes());
		
		log.info("Equipment  saved .... " + plan.getWirecenterNetworkPlan().getPlanId()) ;
		
		fiberRouteRepository.save(plan.getWirecenterNetworkPlan()
				.getFiberRoutes());
		
		log.info("Fiber saved .... " + plan.getWirecenterNetworkPlan().getPlanId()) ;
		
		

	}

	@Override
	public void save(OptimizedPlan optimizedPlan) {
		save(optimizedPlan.getGeneratedPlan()) ;
		networkReportService.saveNetworkReport(optimizedPlan);
	}
}
