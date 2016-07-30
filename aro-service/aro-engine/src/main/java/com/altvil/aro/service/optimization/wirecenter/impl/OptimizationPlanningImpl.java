package com.altvil.aro.service.optimization.wirecenter.impl;

import java.util.Date;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.construction.CableConstructionService;
import com.altvil.aro.service.graph.GraphNetworkModelService;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategyService;
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
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.PricingService;
import com.altvil.utils.StreamUtil;

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
	private transient PricingService pricingService;

	@Autowired
	private transient GraphNetworkModelService graphBuilderService;

	@Autowired
	private transient CoreLeastCostRoutingService planService;

	@Autowired
	private transient CableConstructionService cableConstructionService;

	

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

		GraphNetworkModel model = graphBuilderService
				.build(networkService.getNetworkData(request
						.getNetworkDataRequest()))
				.setCableConstructionPricing(
						cableConstructionService
								.createCableConstructionPricing("*",
										new Date(), request.getRatioBuried()))
				.build();

		return StreamUtil.map(planService.computeNetworkModel(model,
				FiberConstraintUtils.build(request.getConstraints())),
				n -> new DefaultPlannedNetwork(request.getPlanId(), n,
						networkData.getCompetitiveDemandMapping()));

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
					.getPricingModel("*", new Date());

			FtthThreshholds threshHolds = FiberConstraintUtils.build(request
					.getConstraints());

			GraphBuilderContext graphContext = ctx
					.getBean(GraphNetworkModelService.class)
					.build()
					.setCableConstructionPricing(
							ctx.getBean(CableConstructionService.class)
									.createCableConstructionPricing("*",
											new Date(),
											request.getRatioBuried()))
					.createContext();

			return new OptimizerContext(pricingModel, threshHolds, graphContext);
		}
	}

}
