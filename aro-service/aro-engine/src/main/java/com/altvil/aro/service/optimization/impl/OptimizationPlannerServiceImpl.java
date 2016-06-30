package com.altvil.aro.service.optimization.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.Future;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.conversion.SerializationService;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.master.MasterPlanningService;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategy;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategyService;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationResponse;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimization;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultOptimizationResult;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.enumerations.OptimizationType;
import com.altvil.utils.StreamUtil;

@Service
public class OptimizationPlannerServiceImpl implements
		OptimizationPlannerService {

	private static final Logger log = LoggerFactory
			.getLogger(OptimizationPlannerServiceImpl.class.getName());

	private NetworkPlanRepository networkPlanRepository;
	private OptimizationStrategyService strategyService;
	private WirecenterOptimizationService wirecenterOptimizationService;
	private WirecenterPlanningService wirecenterPlanningService;
	private OptimizationExecutorService optimizationExecutorService;
	private MasterPlanningService masterPlanningService;

	private OptimizationExecutor wirecenterExecutor;
	private OptimizationExecutor masterPlanExecutor;
	private SerializationService conversionService;

	@Autowired
	public OptimizationPlannerServiceImpl(
			NetworkPlanRepository networkPlanRepository,
			OptimizationStrategyService strategyService,
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
	public Future<MasterOptimizationResponse> optimize(
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
				strategyService.getOptimizationStrategy(request
						.getOptimizationConstraints()));

	}

	private abstract class MasterOptimizer {

		MasterOptimizationResponse optimize(MasterOptimizationRequest request) {
			Collection<PlannedNetwork> plannedNetworks = planNetworks(computeWireCenterRequests(request));

			Collection<WirecenterNetworkPlan> optimizedNetworks = updateNetworks(plannedNetworks);
			
			masterPlanningService.updateMasterPlan(request.getPlanId()) ;
			
			return new MasterOptimizationResponse(optimizedNetworks);
		}

		protected abstract Collection<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters);

		protected WirecenterNetworkPlan reify(PlannedNetwork plan) {

			WirecenterNetworkPlan reifiedPlan = conversionService.convert(
					plan.getPlanId(), Optional.of(plan.getPlannedNetwork()));

			wirecenterPlanningService.save(reifiedPlan);

			return reifiedPlan;
		}

		protected Collection<WirecenterNetworkPlan> updateNetworks(
				Collection<PlannedNetwork> plannedNetworks) {

			return plannedNetworks.stream().map(this::reify)
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

		protected <T> Collection<T> filter(
				Collection<WirecenterOptimization<T>> optimizations,
				Predicate<T> validResult) {
			return optimizations.stream()
					.filter(o -> o.getOpitmizationException() != null)
					.map(WirecenterOptimization::getResult).filter(validResult)
					.collect(Collectors.toList());
		}

	}

	private class PlanningOptimizer extends MasterOptimizer {
		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters) {
			Collection<ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>>> cmds = StreamUtil
					.map(wirecenters, r -> asPlanCommand(r));

			return evaluate(cmds).stream()
					.filter(w -> w.getOpitmizationException() != null)
					.filter(w -> w.getResult().isPresent())
					.map(w -> w.getResult().get()).collect(Collectors.toList());

		}
	}

	private class PruningOptimizer extends MasterOptimizer {

		private OptimizationStrategy optimizationStrategy;

		public PruningOptimizer(OptimizationStrategy optimizationStrategy) {
			super();
			this.optimizationStrategy = optimizationStrategy;
		}

		@Override
		protected Collection<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters) {

			return optimizationStrategy.evaluateNetworks(filter(
					evaluate(StreamUtil.map(wirecenters,
							w -> asPrunedCommand(w))), v -> v
							.getOptimizedNetworks().size() > 0));

		}

	}

	// private MasterOptimizationResponse doOptimize(
	// MasterOptimizationRequest request) {
	//
	// try {
	//
	// OptimizationStrategy optimizationStrategy = strategyService
	// .getOptimizationStrategy(request
	// .getOptimizationConstraints());
	//
	// DefaultPruningAnalysis pruningAnalysis =
	// pruneNetworks(computeWireCenterRequests(request));
	//
	// Collection<OptimizedWirecenter> optimizedWirecenters =
	// optimizationStrategy
	// .evaluateNetworks(pruningAnalysis);
	//
	// optimizedWirecenters.forEach(w -> {
	// wirecenterPlanningService.save(w.getPlan());
	// });
	//
	// masterPlanningService.updateMasterPlan(request.getPlanId());
	//
	// return new MasterOptimizationResponse(StreamUtil.map(
	// optimizedWirecenters, OptimizedWirecenter::getPlan));
	//
	// } catch (Throwable err) {
	// throw new AroException(err.getMessage(), err);
	// }
	// }

	private ComputeUnitCallable<WirecenterOptimization<Optional<PlannedNetwork>>> asPlanCommand(
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

	private ComputeUnitCallable<WirecenterOptimization<PrunedNetwork>> asPrunedCommand(
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

	private <S> Collection<WirecenterOptimization<S>> evaluate(
			Collection<ComputeUnitCallable<WirecenterOptimization<S>>> cmds) {

		List<Future<WirecenterOptimization<S>>> evalFutures = wirecenterExecutor
				.invokeAll(cmds);

		List<WirecenterOptimization<S>> networks = new ArrayList<>();
		evalFutures.forEach(f -> {
			try {
				WirecenterOptimization<S> pn = f.get();
				networks.add(pn);
			} catch (Exception e) {
				log.error(e.getMessage(), e);
			}
		});

		return networks;

	}

	// private DefaultPruningAnalysis pruneNetworks(
	// Collection<WirecenterOptimizationRequest> requests) {
	//
	// List<Future<PrunedNetwork>> prunedFutures = wirecenterExecutor
	// .invokeAll(StreamUtil.map(requests, this::asPrunnedCommand));
	// List<PrunedNetwork> prunedNetworks = new ArrayList<>();
	// List<OptimizationException> exceptions = new ArrayList<>();
	// prunedFutures.forEach(f -> {
	// try {
	// PrunedNetwork pn = f.get();
	// if (pn.getOpitmizationException() == null) {
	// prunedNetworks.add(pn);
	// } else {
	// exceptions.add(pn.getOpitmizationException());
	// }
	// } catch (Exception e) {
	// exceptions.add(new OptimizationException(e.getMessage()));
	// log.error(e.getMessage(), e);
	// }
	// });
	//
	// return new DefaultPruningAnalysis(false, prunedNetworks, exceptions);
	// }

	// private Collection<WirecenterOptimizationRequest>
	// computeWireCenterRequests(
	// MasterOptimizationRequest request) {
	// networkPlanRepository.deleteWireCenterPlans(request.getPlanId());
	//
	// boolean selectAllLocations = !request.getWireCenters().isEmpty();
	//
	// List<Number> wireCentersPlans = selectAllLocations ?
	// networkPlanRepository
	// .computeWirecenterUpdates(request.getPlanId(),
	// request.getWireCenters()) : networkPlanRepository
	// .computeWirecenterUpdates(request.getPlanId());
	// final LocationSelectionMode selectionMode = selectAllLocations ?
	// LocationSelectionMode.ALL_LOCATIONS
	// : LocationSelectionMode.SELECTED_LOCATIONS;
	//
	// return StreamUtil.map(
	// wireCentersPlans,
	// id -> {
	// return new WirecenterOptimizationRequest(request
	// .getOptimizationConstraints(), request
	// .getConstraints(), request.getNetworkDataRequest()
	// .createRequest(id.longValue(), selectionMode));
	// });
	// }

}
