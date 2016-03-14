package com.altvil.aro.service.planing.impl;

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
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.InputRequests;
import com.altvil.aro.service.plan.PlanService;
import com.altvil.aro.service.planing.MasterPlanCalculation;
import com.altvil.aro.service.planing.MasterPlanUpdate;
import com.altvil.aro.service.planing.NetworkPlanningService;
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

	private ExecutorService executorService;
	private ExecutorService wirePlanExecutor;

	@PostConstruct
	public void init() {
		executorService = Executors.newFixedThreadPool(2);
		wirePlanExecutor = Executors.newFixedThreadPool(5);
	}

	@Override
	@Transactional
	public void save(WirecenterNetworkPlan plan) {
		networkNodeRepository.save(plan.getNetworkNodes());
		fiberRouteRepository.save(plan.getFiberRoutes());
	}

	@Override
	public MasterPlanCalculation planMasterFiber(long planId,
			InputRequests inputRequests,
			FiberNetworkConstraints constraints) {

		List<Long> ids = StreamUtil.map(
				networkPlanRepository.computeWirecenterUpdates(planId),
				Number::longValue);

		Future<MasterPlanUpdate> f = wirePlanExecutor.submit(() -> {

			List<Future<WirecenterNetworkPlan>> futures = wirePlanExecutor
					.invokeAll(ids.stream()
							.map(id -> createCallable(id, constraints))
							.collect(Collectors.toList()));
			return new MasterPlanUpdate(futures.stream().map(wf -> {
				try {
					return wf.get();
				} catch (Exception e) {
					log.error(e.getMessage()) ;
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
	public Future<WirecenterNetworkPlan> planFiber(long planId,
			FiberNetworkConstraints constraints) {
		return executorService.submit(createCallable(planId, constraints));
	}

	private Callable<WirecenterNetworkPlan> createCallable(long planId,
			FiberNetworkConstraints constraints) {

		return () -> {
			Optional<CompositeNetworkModel> model = planService
					.computeNetworkModel(networkService
							.getNetworkData(NetworkRequest.create(planId)),
							constraints);

			WirecenterNetworkPlan plan = conversionService.convert(planId,
					model);

			save(plan);

			return plan;
		};
	}
}
