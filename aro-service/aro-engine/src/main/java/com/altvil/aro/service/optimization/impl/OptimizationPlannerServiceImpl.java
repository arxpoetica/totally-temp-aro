package com.altvil.aro.service.optimization.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.Future;
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
import com.altvil.aro.service.optimization.master.DefaultPruningAnalysis;
import com.altvil.aro.service.optimization.master.MasterOptimizationResult;
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
import com.altvil.aro.service.optimization.wirecenter.OptimizationResult;
import com.altvil.aro.service.optimization.wirecenter.OptimizedWirecenter;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultPrunedNetwork;
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
			MasterOptimizationResult<PlannedNetwork> plannedNetworks = planNetworks(computeWireCenterRequests(request));
			Collection<OptimizedWirecenter> optimizedNetworks = updateNetworks(plannedNetworks);
			return new MasterOptimizationResponse(optimizedNetworks);
		}

		protected abstract MasterOptimizationResult<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters);

		protected OptimizedWirecenter reify(
				OptimizationResult<PlannedNetwork> network) {
			WirecenterNetworkPlan reifiedPlan = conversionService.convert(
					network.getPlanId(), network.getResult()
							.getPlannedNetwork());
			wirecenterPlanningService.save(reifiedPlan);
			return new OptimizedWirecenter(network.getOptimizationRequest(),
					reifiedPlan);
		}

		protected Collection<OptimizedWirecenter> updateNetworks(
				MasterOptimizationResult<PlannedNetwork> plannedNetworks) {

			return plannedNetworks.getWirecenterOptimizations().stream()
					.map(this::reify).collect(Collectors.toList());

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

	}

	private class PlanningOptimizer extends MasterOptimizer {
		@Override
		protected MasterOptimizationResult<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters) {
			return evaluate(StreamUtil.map(wirecenters, r -> asPlanCommand(r)));
		}
	}

	private class PruningOptimizer extends MasterOptimizer {

		private OptimizationStrategy optimizationStrategy;

		public PruningOptimizer(OptimizationStrategy optimizationStrategy) {
			super();
			this.optimizationStrategy = optimizationStrategy;
		}

		@Override
		protected MasterOptimizationResult<PlannedNetwork> planNetworks(
				Collection<WirecenterOptimizationRequest> wirecenters) {

			return optimizationStrategy.evaluateNetworks(evaluate(StreamUtil
					.map(wirecenters, w -> asPrunedCommand1(w))));

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

	private ComputeUnitCallable<OptimizationResult<PlannedNetwork>> asPlanCommand(
			WirecenterOptimizationRequest request) {
		return () -> {
			try {
				return new DefaultPrunedNetwork<>(request,
						wirecenterOptimizationService.planNetwork(request));
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return new DefaultPrunedNetwork<>(request,
						new OptimizationException(err.getMessage()));
			}
		};

	}

	private ComputeUnitCallable<OptimizationResult<PrunedNetwork>> asPrunedCommand1(
			WirecenterOptimizationRequest request) {
		return () -> {
			try {
				return new DefaultPrunedNetwork<>(request,
						wirecenterOptimizationService.pruneNetwork(request));
			} catch (Throwable err) {
				log.error(err.getMessage(), err);
				return new DefaultPrunedNetwork<>(request,
						new OptimizationException(err.getMessage()));
			}
		};

	}

	private ComputeUnitCallable<PrunedNetwork> asPrunnedCommand(
			WirecenterOptimizationRequest request) {
		return () -> wirecenterOptimizationService.pruneNetwork(request);
	}

	private <S> MasterOptimizationResult<S> evaluate(
			Collection<ComputeUnitCallable<OptimizationResult<S>>> cmds) {

		List<Future<OptimizationResult<S>>> evalFutures = wirecenterExecutor
				.invokeAll(cmds);

		List<OptimizationResult<S>> networks = new ArrayList<>();
		List<OptimizationException> exceptions = new ArrayList<>();
		evalFutures.forEach(f -> {
			try {
				OptimizationResult<S> pn = f.get();
				if (pn.getOpitmizationException() == null) {
					networks.add(pn);
				} else {
					exceptions.add(pn.getOpitmizationException());
				}
			} catch (Exception e) {
				exceptions.add(new OptimizationException(e.getMessage()));
				log.error(e.getMessage(), e);
			}
		});

		return new DefaultPruningAnalysis<S>(false, networks, exceptions);

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

	private Collection<WirecenterOptimizationRequest> computeWireCenterRequests(
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
							.getConstraints(), request.getNetworkDataRequest()
							.createRequest(id.longValue(), selectionMode));
				});
	}

}
