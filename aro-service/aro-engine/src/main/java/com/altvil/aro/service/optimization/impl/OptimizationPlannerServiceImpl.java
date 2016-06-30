package com.altvil.aro.service.optimization.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.Future;

import javax.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.AroException;
import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.master.MasterPlanningService;
import com.altvil.aro.service.optimization.master.PruningAnalysis;
import com.altvil.aro.service.optimization.spi.ComputeUnitCallable;
import com.altvil.aro.service.optimization.spi.OptimizationException;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategy;
import com.altvil.aro.service.optimization.strategy.OptimizationStrategyService;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationResponse;
import com.altvil.aro.service.optimization.wirecenter.OptimizedWirecenter;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
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
	private MasterPlanningService masterPlanningService ;
	private CostService costService ;

	private OptimizationExecutor wirecenterExecutor;
	private OptimizationExecutor masterPlanExecutor;

	@Autowired
	public OptimizationPlannerServiceImpl(
			NetworkPlanRepository networkPlanRepository,
			OptimizationStrategyService strategyService,
			WirecenterOptimizationService wirecenterOptimizationService,
			WirecenterPlanningService wirecenterPlanningService,
			OptimizationExecutorService optimizationExecutorService,
			 MasterPlanningService masterPlanningService,
			 CostService costService) {
		super();
		this.networkPlanRepository = networkPlanRepository;
		this.strategyService = strategyService;
		this.wirecenterOptimizationService = wirecenterOptimizationService;
		this.wirecenterPlanningService = wirecenterPlanningService;
		this.optimizationExecutorService = optimizationExecutorService;
		this.masterPlanningService = masterPlanningService ;
		this.costService  = costService ;
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
		return masterPlanExecutor.submit(() -> doOptimize(request));
	}

	private MasterOptimizationResponse doOptimize(
			MasterOptimizationRequest request) {

		try {

			OptimizationStrategy optimizationStrategy = strategyService
					.getOptimizationStrategy(request
							.getOptimizationConstraints());

			PruningAnalysis pruningAnalysis = pruneNetworks(computeWireCenterRequests(request));

			Collection<OptimizedWirecenter> optimizedWirecenters = optimizationStrategy
					.evaluateNetworks(pruningAnalysis);

			optimizedWirecenters.forEach(w -> {
				wirecenterPlanningService.save(w.getPlan());
				costService.updateWireCenterCosts(w.getPlan().getPlanId());
			});
			
			masterPlanningService.updateMasterPlan(request.getPlanId());

			return new MasterOptimizationResponse(StreamUtil.map(
					optimizedWirecenters, OptimizedWirecenter::getPlan));

		} catch (Throwable err) {
			throw new AroException(err.getMessage(), err);
		}
	}

	private ComputeUnitCallable<PrunedNetwork> toComputeUnitCallable(
			WirecenterOptimizationRequest request) {
		return () -> wirecenterOptimizationService.pruneNetwork(request);
	}

	private PruningAnalysis pruneNetworks(
			Collection<WirecenterOptimizationRequest> requests) {

		List<Future<PrunedNetwork>> prunedFutures = wirecenterExecutor
				.invokeAll(StreamUtil
						.map(requests, this::toComputeUnitCallable));
		List<PrunedNetwork> prunedNetworks = new ArrayList<>();
		List<OptimizationException> exceptions = new ArrayList<>();
		prunedFutures.forEach(f -> {
			try {
				PrunedNetwork pn = f.get();
				if (pn.getOpitmizationException() == null) {
					prunedNetworks.add(pn);
				} else {
					exceptions.add(pn.getOpitmizationException());
				}
			} catch (Exception e) {
				exceptions.add(new OptimizationException(e.getMessage()));
				log.error(e.getMessage(), e);
			}
		});

		return new PruningAnalysis(false, prunedNetworks, exceptions);
	}

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
