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
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.PricingModel;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.InputRequests;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanBuilder;
import com.altvil.aro.service.planing.MasterPlanCalculation;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.OptimizationInputs;
import com.altvil.aro.service.planing.ScoringStrategyFactory;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
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
	public JobService.Builder<WirecenterNetworkPlan> optimizeWirecenter(Principal username, long planId, InputRequests inputRequests,
			OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) {
		return new JobService.Builder<WirecenterNetworkPlan>(username).setCallable(createOptimzedCallable(NetworkRequest.create(planId, NetworkRequest.LocationLoadingRequest.ALL),
						optimizationInputs, constraints)).setExecutorService(executorService);
	}

	@Override
	@Transactional
	public void save(WirecenterNetworkPlan plan) {
		networkNodeRepository.save(plan.getNetworkNodes());
		fiberRouteRepository.save(plan.getFiberRoutes());
	}

	public MasterPlanCalculation optimizeMasterFiber(long planId,
			InputRequests inputRequests, OptimizationInputs optimizationInputs,
			FiberNetworkConstraints constraints) {

		networkPlanRepository.deleteWireCenterPlans(planId);

		List<Long> ids = StreamUtil.map(
				networkPlanRepository.computeWirecenterUpdates(planId),
				Number::longValue);

		Future<MasterPlanUpdate> f = executorService.submit(() -> {

			List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor
					.invokeAll(ids
							.stream()
							.map(id -> createOptimzedCallable(
									NetworkRequest.create(id),
									optimizationInputs, constraints))
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
	public MasterPlanBuilder planMasterFiber(Principal username, long planId,
			InputRequests inputRequests, FiberNetworkConstraints constraints) {

		networkPlanRepository.deleteWireCenterPlans(planId);

		List<Long> ids = StreamUtil.map(
				networkPlanRepository.computeWirecenterUpdates(planId),
				Number::longValue);
		
		MasterPlanBuilder builder = new MasterPlanBuilder(username);
		builder.setWireCenterPlans(ids);
		builder.setCallable(() -> {
			List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor
					.invokeAll(ids.stream()
							.map(id -> createPlanningCallable(id, constraints))
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
	public Future<WirecenterNetworkPlan> planFiber(long planId,
			FiberNetworkConstraints constraints) {
		return executorService.submit(createPlanningCallable(planId,
				constraints));
	}

	private Callable<WirecenterNetworkPlan> createPlanningCallable(long planId,
			FiberNetworkConstraints constraints) {

		return () -> {

			NetworkData networkData = networkService
					.getNetworkData(NetworkRequest.create(planId));

			Optional<CompositeNetworkModel> model = planService
					.computeNetworkModel(networkData, constraints);
			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(planId,
						model);
				save(plan);
				return plan;
			}

			// TODO KG
			return null;
		};
	}
	

	private Callable<WirecenterNetworkPlan> createOptimzedCallable(
			NetworkRequest networkRequest,
			OptimizationInputs optimizationInputs,
			FiberNetworkConstraints constraints) {

		return () -> {

			NetworkData networkData = networkService
					.getNetworkData(networkRequest);

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
			

			NetworkPlanner planner = optimizerService.createNetworkPlanner((
					networkAnalysis) -> false, networkData, ctx, (
					GeneratingNode) -> true, scoringStrategyFactory
					.getScoringStrategy(optimizationInputs
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
								&& (ratio >= optimizationInputs
										.getCoverage());
						return predicate;
					}).collect(Collectors.toList());
			
			Collections.reverse(plans) ;
			Optional<OptimizedNetwork> model = plans.stream().findFirst() ;

			if (model.isPresent()) {
				WirecenterNetworkPlan plan = conversionService.convert(
						networkRequest.getPlanId(), model.get()
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
