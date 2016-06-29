package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategyService;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.planning.FiberConstraintUtils;
import com.altvil.aro.service.price.PricingService;

@Service
public class OptimizationPlanningImpl implements WirecenterOptimizationService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(OptimizationPlanningImpl.class.getName());

	@Autowired
	private OptimizationStrategyService optimizationStrategyService;

	@Autowired
	private transient NetworkDataService networkService;

	@Autowired
	private transient FTTHOptimizerService optimizerService;

	@Autowired
	private PricingService pricingService;

	// @Transactional
	// private void saveUpdate(WirecenterNetworkPlan plan) {
	// networkNodeRepository.save(plan.getNetworkNodes());
	// fiberRouteRepository.save(plan.getFiberRoutes());
	// }

	private OptimizerContext createOptimizerContext(
			WirecenterOptimizationRequest request) {
		return new OptimizerContext(pricingService.getPricingModel("*",
				new Date()), FiberConstraintUtils.build(request
				.getConstraints()));
	}

	@Override
	public PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request) {

		NetworkData networkData = networkService.getNetworkData(request
				.getNetworkDataRequest());

		NetworkPlanner planner = optimizerService.createNetworkPlanner(
				networkData, optimizationStrategyService
						.getPruningStrategy(request
								.getOptimizationConstraints()),
				optimizationStrategyService.getScoringStrategy(request
						.getOptimizationConstraints()),
				createOptimizerContext(request));

		return new DefaultPrunedNetwork(request, planner.getOptimizedPlans());

		// Collection<OptimizedNetwork> optimizedPlans = planner
		// .getOptimizedPlans();
		//
		// Optional<OptimizedNetwork> model = strategy
		// .selectOptimization(optimizedPlans);
		//
		// if (model.isPresent()) {
		// WirecenterNetworkPlan plan = conversionService.convert(
		// request.getPlanId(), model.get().getNetworkPlan());
		//
		// if (!plan.getNetworkNodes().isEmpty()) {
		// saveUpdate(plan);
		// }
		// costService.updateWireCenterCosts(plan.getPlanId());
		// //return plan;
		//
		//
		// }
		//
		// return null ;

	}

}
