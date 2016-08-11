package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Date;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.GraphNetworkModelService;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorService;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.FTTHOptimizerService.OptimizerContextBuilder;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService;
import com.altvil.aro.service.planning.FiberConstraintUtils;
import com.altvil.aro.service.price.PricingContext;
import com.altvil.aro.service.price.PricingModel;
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
	private transient PricingService pricingService;

	@Autowired
	private transient GraphNetworkModelService graphBuilderService;

	@Autowired
	private transient CoreLeastCostRoutingService planService;
	

	//
	// private Collection<NetworkDemand> toNetworkDemands(NetworkData
	// networkData) {
	//
	// List<NetworkDemand> demands = new ArrayList<>();
	//
	// demands.add(new NetworkDemand(DemandTypeEnum.new_demand,
	// SpeedCategory.cat7, networkData.getDemandAnalysis()
	// .getSelectedDemand()));
	//
	// demands.add(new NetworkDemand(DemandTypeEnum.original_demand,
	// SpeedCategory.cat3, networkData.getDemandAnalysis()
	// .getLocationDemand(SpeedCategory.cat3)));
	//
	// return demands;
	// }

	@Override
	public Optional<PlannedNetwork> planNetwork(
			WirecenterOptimizationRequest request) {

		NetworkData networkData = networkService.getNetworkData(request
				.getNetworkDataRequest());

		return planNetwork(request, networkData);
	}

	@Override
	public Optional<PlannedNetwork> planNetwork(WirecenterOptimizationRequest request, NetworkData networkData) {


		PricingModel pricingModel = pricingService.getPricingModel("*",
				new Date(),
				PricingContext.create(request.getConstructionRatios())) ;
		
		GraphNetworkModel model = graphBuilderService
				.build(networkService.getNetworkData(request
						.getNetworkDataRequest()))
				.setPricingModel(pricingModel)
				.build();

		return StreamUtil.map(planService.computeNetworkModel(model,
				pricingModel,
				FiberConstraintUtils.build(request.getConstraints())),
				n -> new DefaultPlannedNetwork(request.getPlanId(), n,
						networkData.getCompetitiveDemandMapping()));

	}

	@Override
	public PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request) {

		//TODO KAMIL ThresholdBudgetConstraint => Change to OptimizationConstraint
		
		OptimizationEvaluator evaluator =  
				optimizationEvaluatorService
				.getOptimizationEvaluator((ThresholdBudgetConstraint) request
						.getOptimizationConstraints()) ;
		
		NetworkData networkData = networkService.getNetworkData(request
				.getNetworkDataRequest());
		NetworkPlanner planner = optimizerService.createNetworkPlanner(
				networkData, evaluator.getPruningStrategy(),
				evaluator.getScoringStrategy(),
				new OptimizerContextBuilderImpl(request));

		return new PrunedNetworkImpl(request.getPlanId(),
				planner.getOptimizedPlans(),
				networkData.getCompetitiveDemandMapping());
	}

	@SuppressWarnings("serial")
	public static class OptimizerContextBuilderImpl implements
			OptimizerContextBuilder {

		private WirecenterOptimizationRequest request;

		public OptimizerContextBuilderImpl(WirecenterOptimizationRequest request) {
			super();
			this.request = request;
		}

		@Override
		public OptimizerContext createOptimizerContext(ApplicationContext ctx) {
			PricingModel pricingModel = ctx.getBean(PricingService.class)
					.getPricingModel("*", new Date(), PricingContext.create(request.getConstructionRatios()));

			FtthThreshholds threshHolds = FiberConstraintUtils.build(request
					.getConstraints());

			GraphBuilderContext graphContext = ctx
					.getBean(GraphNetworkModelService.class)
					.build()
					.setPricingModel(pricingModel)
					.createContext();

			return new OptimizerContext(pricingModel, threshHolds, graphContext);
		}
	}

}
