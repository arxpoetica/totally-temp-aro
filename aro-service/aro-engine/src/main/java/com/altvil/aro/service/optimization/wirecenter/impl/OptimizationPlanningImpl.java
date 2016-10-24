package com.altvil.aro.service.optimization.wirecenter.impl;

import static com.altvil.interfaces.NetworkAssignmentModel.SelectionFilter.ALL;
import static com.altvil.interfaces.NetworkAssignmentModel.SelectionFilter.SELECTED;

import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.FinancialInputs;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.graph.GraphNetworkModelService;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.network.NetworkDataRequest;
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
import com.altvil.aro.service.optimize.spi.PredicateStrategyType;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService;
import com.altvil.aro.service.plan.impl.LcrContextImpl;
import com.altvil.aro.service.planning.FiberConstraintUtils;
import com.altvil.aro.service.price.PricingContext;
import com.altvil.aro.service.price.PricingModel;
import com.altvil.aro.service.price.PricingService;
import com.altvil.aro.service.property.SystemPropertyService;
import com.altvil.enumerations.OptimizationType;
import com.altvil.interfaces.NetworkAssignment;
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
	private transient CoreLeastCostRoutingService coreLeastCostRoutingService;

	@Autowired
	private transient SystemPropertyService systemPropertyService;

	@Override
	public Optional<PlannedNetwork> planNetwork(
			WirecenterOptimizationRequest request) {

		NetworkData networkData = networkService.getNetworkData(request
				.getNetworkDataRequest());

		return planNetwork(request, networkData);
	}

	@Override
	public Optional<PlannedNetwork> planNetwork(
			WirecenterOptimizationRequest request, NetworkData networkData) {

		return planNetwork(request, networkData,
				ScalarClosestFirstSurfaceIterator.BUILDER);
	}

	@Override
	public Optional<PlannedNetwork> planNpvNetwork(
			WirecenterOptimizationRequest request, NetworkData networkData) {
		FinancialInputs financialInputs = new FinancialInputs(request
				.getOptimizationConstraints().getDiscountRate(), request
				.getOptimizationConstraints().getYears());
		return planNetwork(request, networkData,
				new NpvClosestFirstIterator.Builder(financialInputs));
	}

	private Optional<PlannedNetwork> planNetwork(
			WirecenterOptimizationRequest request, NetworkData networkData,
			ClosestFirstSurfaceBuilder itr) {

		PricingModel pricingModel = pricingService.getPricingModel("*",
				new Date(),
				PricingContext.create(request.getConstructionRatios()));

		GraphNetworkModel model = graphBuilderService.build(networkData)
				.setPricingModel(pricingModel).build();

		return StreamUtil.map(
				coreLeastCostRoutingService.computeNetworkModel(model,
						LcrContextImpl.create(pricingModel,
								FiberConstraintUtils.build(request
										.getConstraints(),
										systemPropertyService
												.getConfiguration()), itr)),
				n -> new DefaultPlannedNetwork(request.getPlanId(), n,
						networkData.getCompetitiveDemandMapping()));

	}

	private Predicate<GraphEdgeAssignment> createLockedPredicate(
			Collection<NetworkAssignment> lockedTargets) {

		if (lockedTargets == null || lockedTargets.size() == 0) {
			return (na) -> true;
		}

		Set<Long> lockedLocationIds = lockedTargets.stream()
				.map(NetworkAssignment::getSource).map(AroEntity::getObjectId)
				.collect(Collectors.toSet());

		return (edgeAssignment) -> {
			if(edgeAssignment == null)
				return false;
			AroEntity aroEntity = edgeAssignment.getAroEntity();

			if (aroEntity instanceof BulkFiberTerminal) {
				BulkFiberTerminal bft = (BulkFiberTerminal) aroEntity;
				return lockedLocationIds.contains(bft.getLocationEntity()
						.getObjectId());
			} else if (aroEntity instanceof FDTEquipment) {
				FDTEquipment fdt = (FDTEquipment) edgeAssignment.getAroEntity();
				for (LocationDropAssignment a : fdt.getDropAssignments()) {
					if (lockedLocationIds.contains(a.getLocationEntity()
							.getObjectId())) {
						return true;
					}
				}
			}

			return false;
		};
	}

	@Override
	public PrunedNetwork pruneNetwork(WirecenterOptimizationRequest request) {
		// TODO KAMIL ThresholdBudgetConstraint => Change to
		// OptimizationConstraint

		boolean isLockedPrunning = request.getOptimizationConstraints()
				.isForced();

		NetworkDataRequest networkDataRequest = request.getNetworkDataRequest();

		NetworkData networkData;

		Collection<NetworkAssignment> lockedTargets = Collections.emptySet();

		if (isLockedPrunning) {
			// Force all data to be loaded
			// Track Selected Locations for Forced Pruning
			networkDataRequest = networkDataRequest.createFilterRequest(EnumSet
					.of(ALL, SELECTED));

			// Force Selection Mode to be ALL Locations
			networkData = networkService.getNetworkData(networkDataRequest)
					.create(ALL);

			lockedTargets = networkData.getRoadLocations().getAssignments(
					SELECTED);

		} else {
			networkData = networkService.getNetworkData(networkDataRequest);
		}

		OptimizationEvaluator evaluator = optimizationEvaluatorService
				.getOptimizationEvaluator((ThresholdBudgetConstraint) request
						.getOptimizationConstraints());

		PruningStrategy pruningStrategy = evaluator
				.getPruningStrategy()
				.modify()
				.and(PredicateStrategyType.PRUNE_CANDIDATE,
						(node) -> !node.isLocked()
				).commit();

		NetworkPlanner planner = optimizerService.createNetworkPlanner(
				networkData, pruningStrategy, evaluator.getScoringStrategy(),
				new OptimizerContextBuilderImpl(request),
				createLockedPredicate(lockedTargets));

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
					.getPricingModel(
							"*",
							new Date(),
							PricingContext.create(request
									.getConstructionRatios()));

			FtthThreshholds threshHolds = FiberConstraintUtils
					.build(request.getConstraints(),
							ctx.getBean(SystemPropertyService.class)
									.getConfiguration());

			GraphBuilderContext graphContext = ctx
					.getBean(GraphNetworkModelService.class).build()
					.setPricingModel(pricingModel).createContext();

			FinancialInputs financialInputs = new FinancialInputs(request
					.getOptimizationConstraints().getDiscountRate(), request
					.getOptimizationConstraints().getYears());

			return new OptimizerContext(pricingModel, threshHolds,
					graphContext, financialInputs);
		}
	}

}
