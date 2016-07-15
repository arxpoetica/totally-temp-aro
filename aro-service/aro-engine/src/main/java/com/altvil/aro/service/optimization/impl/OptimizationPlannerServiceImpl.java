package com.altvil.aro.service.optimization.impl;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Future;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.master.GeneratedMasterPlan;
import com.altvil.aro.service.optimization.master.MasterPlanningService;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluator;
import com.altvil.aro.service.optimization.strategy.OptimizationEvaluatorService;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.enumerations.OptimizationType;
import com.altvil.utils.StreamUtil;

@Service
public class OptimizationPlannerServiceImpl implements
		OptimizationPlannerService {

	private static final Logger log = LoggerFactory
			.getLogger(OptimizationPlannerServiceImpl.class.getName());

	private NetworkPlanRepository networkPlanRepository;
	private OptimizationEvaluatorFactory strategyService;
	private WirecenterOptimizationService wirecenterOptimizationService;
	private WirecenterPlanningService wirecenterPlanningService;
	private OptimizationExecutorService optimizationExecutorService;
	
	private MasterPlanningService masterPlanningService;
	private SerializationService conversionService;

	private OptimizationExecutor wirecenterExecutor;
	private OptimizationExecutor masterPlanExecutor;

	@Autowired
	public OptimizationPlannerServiceImpl(
			NetworkPlanRepository networkPlanRepository,
			OptimizationEvaluatorFactory strategyService,
			WirecenterOptimizationService wirecenterOptimizationService,
			WirecenterPlanningService wirecenterPlanningService,
			OptimizationExecutorService optimizationExecutorService,
			MasterPlanningService masterPlanningService,
			SerializationService conversionService) {
		super();
		this.networkPlanRepository = networkPlanRepository;
		this.strategyService = strategyService;
		this.wirecenterOptimizationService = wirecenterOptimizationService;
		this.wirecenterPlanningService = wirecenterPlanningService;
		this.optimizationExecutorService = optimizationExecutorService;
		this.masterPlanningService = masterPlanningService;
		this.conversionService = conversionService;
	}

	@PostConstruct
	void postConstruct() {
		wirecenterExecutor = optimizationExecutorService
				.createOptimizationExecutor(ExecutorType.Wirecenter);

		masterPlanExecutor = optimizationExecutorService
				.createOptimizationExecutor(ExecutorType.MasterPlan);
	}

	@Override
	public Future<OptimizedMasterPlan> optimize(
			MasterOptimizationRequest request) {
		MasterOptimizer masterOptimizer = createMasterOptimizer(request);
		return masterPlanExecutor.submit(() -> masterOptimizer
				.optimize(request));
	}

	private MasterOptimizer createMasterOptimizer(
			MasterOptimizationRequest request) {

		if (request.getOptimizationConstraints() == null
				|| request.getOptimizationConstraints().getOptimizationType() == OptimizationType.UNCONSTRAINED) {
			return new PlanningOptimizer();
		}

		return new PruningOptimizer(
				strategyService.getOptimizationEvaluator((ThresholdBudgetConstraint)request
						.getOptimizationConstraints(), request.getOptimizationMode()) );

	}

	private abstract class MasterOptimizer {

		OptimizedMasterPlan optimize(MasterOptimizationRequest request) {

			Collection<PlannedNetwork> plannedNetworks = planNetworks(computeWireCenterRequests(request));

			Collection<OptimizedPlan> optimizedNetworks = updateNetworks(
					request.getOptimizationConstraints(), plannedNetworks);

			return masterPlanningService.save(new GeneratedMasterPlanImpl(
					request, optimizedNetworks));

		}

		protected abstract Collection<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters);

		protected OptimizedPlan reify(OptimizationConstraints constraints,
				PlannedNetwork plan) {

			WirecenterNetworkPlan reifiedPlan = conversionService.convert(
					plan.getPlanId(), Optional.of(plan.getPlannedNetwork()));

			NetworkDemandSummary demandSummary = NetworkDemandSummaryImpl
					.build()
					.add(plan.getNetworkDemands())
					.add(DemandTypeEnum.planned_demand, SpeedCategory.cat7,
							reifiedPlan.getDemandCoverage().getLocationDemand())
					.build();

			return wirecenterPlanningService.save(new GeneratedPlanImpl(
					demandSummary, constraints, reifiedPlan));

		}

		protected Collection<OptimizedPlan> updateNetworks(
				OptimizationConstraints constraints,
				Collection<PlannedNetwork> plannedNetworks) {

			return plannedNetworks.stream().map(p -> reify(constraints, p))
					.collect(Collectors.toList());

		}

		protected Collection<WirecenterOptimizationRequest> computeWireCenterRequests(
				MasterOptimizationRequest request) {
			networkPlanRepository.deleteWireCenterPlans(request.getPlanId());

			boolean selectAllLocations = !request.getWireCenters().isEmpty();

			List<Number> wireCentersPlans = selectAllLocations ? networkPlanRepository
					.computeWirecenterUpdates(request.getPlanId(),
							request.getWireCenters()) : networkPlanRepository
					.computeWirecenterUpdates(request.getPlanId());
			final LocationSelectionMode selectionMode = selectAllLocations ? LocationSelectionMode.ALL_LOCATIONS
					: LocationSelectionMode.SELECTED_LOCATIONS;

			return StreamUtil.map(
					wireCentersPlans,
					id -> {
						return new WirecenterOptimizationRequest(request
								.getOptimizationConstraints(), request
								.getConstraints(), request
								.getNetworkDataRequest().createRequest(
										id.longValue(), selectionMode));
					});
		}

		protected <S> Collection<ComputeUnitCallable<WirecenterOptimization<S>>> toCommands(
				Collection<WirecenterOptimizationRequest> requests,
				Function<WirecenterOptimizationRequest, ComputeUnitCallable<WirecenterOptimization<S>>> cmdBuilder) {
			return StreamUtil.map(requests, w -> cmdBuilder.apply(w));
		}

	}

	private class PlanningOptimizer extends MasterOptimizer {

		private ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>> asCommand(
				WirecenterOptimizationRequest request) {
			return () -> {
				try {
					return new DefaultOptimizationResult<>(request,
							wirecenterOptimizationService.planNetwork(request));
				} catch (Throwable err) {
					log.error(err.getMessage(), err);
					return new DefaultOptimizationResult<>(request,
							new OptimizationException(err.getMessage()));
				}
			};

		}

		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters) {

			return evaluateWirecenterCommands(
					toCommands(wirecenters, this::asCommand),
					Optional::isPresent).stream().map(Optional::get)
					.collect(Collectors.toList());

		}
	}

	private class PruningOptimizer extends MasterOptimizer {

		private OptimizationEvaluator optimizationEvaluator;

		public PruningOptimizer(OptimizationEvaluator optimizationEvaluator) {
			super();
			this.optimizationEvaluator = optimizationEvaluator;
		}

		private ComputeUnitCallable<WirecenterOptimization<PrunedNetwork>> asCommand(
				WirecenterOptimizationRequest request) {
			return () -> {
				try {
					return new DefaultOptimizationResult<>(request,
							wirecenterOptimizationService.pruneNetwork(request));
				} catch (Throwable err) {
					log.error(err.getMessage(), err);
					return new DefaultOptimizationResult<>(request,
							new OptimizationException(err.getMessage()));
				}
			};

		}

		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters) {

			Collection<PrunedNetwork> prunedNetworks = evaluateWirecenterCommands(
					toCommands(wirecenters, this::asCommand), n -> !n.isEmpty());

			return optimizationEvaluator.evaluateNetworks(prunedNetworks);

		}

	}

	private <S> Collection<S> evaluateWirecenterCommands(
			Collection<ComputeUnitCallable<WirecenterOptimization<S>>> cmds,
			Predicate<S> validPredicate) {

		return wirecenterExecutor
				.invokeAll(cmds)
				.stream()
				.map(f -> {
					try {
						return f.get();
					} catch (Exception e) {
						log.error(e.getMessage(), e);
						return new DefaultOptimizationResult<S>(null,
								new OptimizationException(e.getMessage()));
					}
				}).filter(o -> !o.isInError())
				.map(WirecenterOptimization::getResult).filter(validPredicate)
				.collect(Collectors.toList());

	}

	private static class GeneratedMasterPlanImpl implements GeneratedMasterPlan {

		private MasterOptimizationRequest masterOptimizationRequest;
		private Collection<OptimizedPlan> optimizedPlans;

		public GeneratedMasterPlanImpl(
				MasterOptimizationRequest masterOptimizationRequest,
				Collection<OptimizedPlan> optimizedPlans) {
			super();
			this.masterOptimizationRequest = masterOptimizationRequest;
			this.optimizedPlans = optimizedPlans;
		}

		@Override
		public MasterOptimizationRequest getOptimizationRequest() {
			return masterOptimizationRequest;
		}

		@Override
		public Collection<OptimizedPlan> getOptimizedPlans() {
			return optimizedPlans;
		}
	}

	private static class GeneratedPlanImpl implements GeneratedPlan {

		private NetworkDemandSummary networkDemandSummary;
		private OptimizationConstraints optimizationConstraints;
		private WirecenterNetworkPlan wirecenterNetworkPlan;

		public GeneratedPlanImpl(NetworkDemandSummary networkDemandSummary,
				OptimizationConstraints optimizationConstraints,
				WirecenterNetworkPlan wirecenterNetworkPlan) {
			super();
			this.networkDemandSummary = networkDemandSummary;
			this.optimizationConstraints = optimizationConstraints;
			this.wirecenterNetworkPlan = wirecenterNetworkPlan;
		}

		@Override
		public NetworkDemandSummary getDemandSummary() {
			return networkDemandSummary;
		}

		@Override
		public OptimizationConstraints getOptimizationConstraints() {
			return optimizationConstraints;
		}

		@Override
		public WirecenterNetworkPlan getWirecenterNetworkPlan() {
			return wirecenterNetworkPlan;
		}

	}

}
