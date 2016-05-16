package com.altvil.aro.service.planing.impl;

import java.security.Principal;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanCalculation;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.ScoringStrategyFactory;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;
import com.altvil.utils.StreamUtil;

@Service
public class NetworkPlanningServiceImpl implements NetworkPlanningService {
	private static final Logger log = LoggerFactory
			.getLogger(NetworkPlanningServiceImpl.class.getName());

	@Autowired
	private NetworkNodeRepository networkNodeRepository;

	@Autowired
	private NetworkPlanRepository networkPlanRepository;

	@Autowired
	private FiberRouteRepository fiberRouteRepository;

	@Autowired
	private PlanService planService;

	@Autowired
	private NetworkService networkService;

	@Autowired
	private SerializationService conversionService;

	@Autowired
	private FTTHOptimizerService optimizerService;

	@Autowired
	private ScoringStrategyFactory scoringStrategyFactory;

	private ExecutorService executorService;
	private ExecutorService wirePlanExecutor;

	@PostConstruct
	public void init() {
		executorService = Executors.newFixedThreadPool(2);
		wirePlanExecutor = Executors.newFixedThreadPool(5);
	}

	@Override
	public JobService.Builder<WirecenterNetworkPlan> optimizeWirecenter(Principal username, OptimizationPlanConfiguration optimizationPlanStrategy, FiberNetworkConstraints constraints) {
		return new JobService.Builder<WirecenterNetworkPlan>(username).setCallable(createOptimzedCallable(optimizationPlanStrategy, constraints)).setExecutorService(executorService);
	}

	@Override
	@Transactional
	public void save(WirecenterNetworkPlan plan) {
		networkNodeRepository.save(plan.getNetworkNodes());
		fiberRouteRepository.save(plan.getFiberRoutes());
	}

	@Override
	public MasterPlanCalculation optimizeMasterFiber(OptimizationPlanConfiguration optimizationPlanStrategy, FiberNetworkConstraints constraints) {

		networkPlanRepository.deleteWireCenterPlans(optimizationPlanStrategy.getPlanId());

		List<Long> ids = StreamUtil
				.map(networkPlanRepository.computeWirecenterUpdates(optimizationPlanStrategy.getPlanId()), Number::longValue);
		Function<Number, OptimizationPlanConfiguration> transform = new Function<Number, OptimizationPlanConfiguration>() {
			@Override
			public OptimizationPlanConfiguration apply(Number dependentId) {
				return optimizationPlanStrategy.dependentPlan(dependentId.longValue());
			}
		};

		List<OptimizationPlanConfiguration> plans = StreamUtil
				.map(networkPlanRepository.computeWirecenterUpdates(optimizationPlanStrategy.getPlanId()),transform
				);

		Future<MasterPlanUpdate> f = executorService.submit(() -> {

			List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor
					.invokeAll(plans
							.stream()
							.map(plan -> createOptimzedCallable(plan, constraints))
							.collect(Collectors.toList()));
			return new MasterPlanUpdate(futures.stream().map(wf -> {
				try {
					return wf.get();
				} catch (Exception e) {
					log.error(e.getMessage());
					return null;
				}
			}).filter(p -> p != null).collect(Collectors.toList()));
		});

		return new MasterPlanCalculation() {
			@Override
			public List<Long> getWireCenterPlans() {
				return ids;
			}

			@Override
			public Future<MasterPlanUpdate> getFuture() {
				return f;
			}
		};

	}

	@Override
	public MasterPlanBuilder planMasterFiber(Principal username, final FiberPlanConfiguration fiberPlanStrategy, FiberNetworkConstraints constraints) {

		networkPlanRepository.deleteWireCenterPlans(fiberPlanStrategy.getPlanId());
		
		Function<Number, FiberPlanConfiguration> transform = new Function<Number, FiberPlanConfiguration>(){
			@Override
			public FiberPlanConfiguration apply(Number dependentId) {
				return fiberPlanStrategy.dependentPlan(dependentId.longValue());
			}
			};

		List<FiberPlanConfiguration> plans = StreamUtil.map(
				networkPlanRepository.computeWirecenterUpdates(fiberPlanStrategy.getPlanId()),transform
				);
		
		MasterPlanBuilder builder = new MasterPlanBuilder(username);
		builder.setWireCenterPlans(plans);
		builder.setCallable(() -> {
			List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor
					.invokeAll(plans.stream()
							.map(plan -> createPlanningCallable(plan, constraints))
							.collect(Collectors.toList()));
			return new MasterPlanUpdate(futures.stream().map(wf -> {
				try {
					return wf.get();
				} catch (Exception e) {
					log.error(e.getMessage());
					return null;
				}
			}).filter(p -> p != null).collect(Collectors.toList()));
		});
		builder.setExecutorService(executorService);

		return builder;
	}
	
	@Override
	public Future<WirecenterNetworkPlan> planFiber(FiberPlanConfiguration fiberPlanStrategy,
			FiberNetworkConstraints constraints) {
		return executorService.submit(createPlanningCallable(fiberPlanStrategy, 
				constraints));
	}

	private Callable<WirecenterNetworkPlan> createPlanningCallable(FiberPlanConfiguration fiberPlanStrategy, FiberNetworkConstraints constraints) {

		return () -> {
			NetworkData networkData = networkService
					.getNetworkData(fiberPlanStrategy);
			
			
			ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder = fiberPlanStrategy.getClosestFirstSurfaceBuilder();
			Predicate<AroEdge<GeoSegment>> selectedEdges = fiberPlanStrategy.getSelectedEdges(networkData);

			Optional<CompositeNetworkModel> model = planService
					.computeNetworkModel(networkData, closestFirstSurfaceBuilder, selectedEdges, constraints);
			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(fiberPlanStrategy.getPlanId(),
						model);
				save(plan);
				return plan;
			}

			// TODO KG
			return null;
		};
	}
	

	private Callable<WirecenterNetworkPlan> createOptimzedCallable(OptimizationPlanConfiguration optimizationPlanStrategy,
			FiberNetworkConstraints constraints) {

		return () -> {

			NetworkData networkData = networkService
					.getNetworkData(optimizationPlanStrategy);

			OptimizerContext ctx = new OptimizerContext(
					new DefaultPriceModel(),
					planService.createFtthThreshholds(constraints), constraints);

			double totalDemand = networkData
					.getRoadLocations()
					.stream()
					.mapToDouble(
							a -> ((LocationEntity) a.getSource())
									.getLocationDemand().getDemand()).sum();
			
			log.info("Target total = " + totalDemand) ;
			
			

			NetworkPlanner planner = optimizerService.createNetworkPlanner(optimizationPlanStrategy.getClosestFirstSurfaceBuilder(),
					optimizationPlanStrategy.getSelectedEdges(networkData), (
					networkAnalysis) -> false, networkData, ctx, (
					GeneratingNode) -> true, scoringStrategyFactory
					.getScoringStrategy(optimizationPlanStrategy
							.getOptimizationType()));

			Collection<OptimizedNetwork> optimizedPlans = planner
					.getOptimizedPlans();

			
			
			List<OptimizedNetwork> plans = optimizedPlans
					.stream()
					.filter(p -> {

						double ratio = p.getAnalysisNode().getFiberCoverage()
								.getDemand()
								/ totalDemand;

						System.out.println(ratio);

						boolean predicate = !p.isEmpty()
								&& (ratio >= optimizationPlanStrategy
										.getCoverage());
						return predicate;
					}).collect(Collectors.toList());
			
			Collections.reverse(plans) ;
			Optional<OptimizedNetwork> model = plans.stream().findFirst() ;

			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(
						optimizationPlanStrategy.getPlanId(),  model.get()
								.getNetworkPlan());
				save(plan);
				return plan;
			}

			// TODO KG
			return null;
		};
	}

	private static class DefaultPriceModel implements PricingModel {

		@Override
		public double getPrice(DropCable dropCable) {
			return 0.5 * dropCable.getLength() ;
		}

		@Override
		public double getMaterialCost(MaterialType type) {
			switch (type) {
			case FDT:
				return 20;
			case FDH:
				return 2000;
			case BFT:
				return 400;
			case SPLITTER_16:
				return 1500;
			case SPLITTER_32:
				return 2000;
			case SPLITTER_64:
				return 2500;

			default:
				return 0;
			}
		}

		@Override
		public double getFiberCostPerMeter(FiberType fiberType,
				int requiredFiberStrands) {
			return 4;
		}

	}
}
