package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorService;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemand;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planning.FiberConstraintUtils;
import com.altvil.aro.service.price.PricingService;
import com.altvil.utils.StreamUtil;

@Service
public class OptimizationPlanningImpl implements WirecenterOptimizationService {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(OptimizationPlanningImpl.class.getName());

	@Autowired
	@Qualifier("singleEvaluator")
	private OptimizationEvaluatorService optimizationEvaluatorService;

	@Autowired
	private transient NetworkDataService networkService;

	@Autowired
	private transient FTTHOptimizerService optimizerService;

	@Autowired
	private PricingService pricingService;

	@Autowired
	private PlanService planService;

	private OptimizerContext createOptimizerContext(
			WirecenterOptimizationRequest request) {
		return new OptimizerContext(pricingService.getPricingModel("*",
				new Date()), FiberConstraintUtils.build(request
				.getConstraints()));
	}

	private Collection<NetworkDemand> toNetworkDemands(NetworkData networkData) {

		List<NetworkDemand> demands = new ArrayList<>();

		demands.add(new NetworkDemand(DemandTypeEnum.new_demand,
				SpeedCategory.cat7, networkData.getDemandAnalysis()
						.getSelectedDemand()));

		demands.add(new NetworkDemand(DemandTypeEnum.original_demand,
				SpeedCategory.cat3, networkData.getDemandAnalysis()
						.getLocationDemand(SpeedCategory.cat3)));

		return demands;
	}

	@Override
	public Optional<PlannedNetwork> planNetwork(
			WirecenterOptimizationRequest request) {

		NetworkData networkData = networkService.getNetworkData(request
				.getNetworkDataRequest());

		return StreamUtil.map(planService.computeNetworkModel(networkData,
				FiberConstraintUtils.build(request.getConstraints())),
				n -> new DefaultPlannedNetwork(request.getPlanId(), n,
						toNetworkDemands(networkData)));

	}

	@Override
	public PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request) {

		NetworkData networkData = networkService.getNetworkData(request
				.getNetworkDataRequest());
		OptimizationEvaluator evaluator = optimizationEvaluatorService.getOptimizationEvaluator((ThresholdBudgetConstraint)request
				.getOptimizationConstraints());
		NetworkPlanner planner = optimizerService.createNetworkPlanner(
				networkData, evaluator.getPruningStrategy(),
				evaluator.getScoringStrategy(),
				createOptimizerContext(request));

		return new PrunedNetworkImpl(request.getPlanId(),
				planner.getOptimizedPlans(), toNetworkDemands(networkData));
	}

}
