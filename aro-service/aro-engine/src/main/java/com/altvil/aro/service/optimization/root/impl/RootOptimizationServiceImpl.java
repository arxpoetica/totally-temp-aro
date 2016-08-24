package com.altvil.aro.service.optimization.root.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.RootPlan;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.MasterPlanRepository;
import com.altvil.aro.persistence.repository.RootPlanRepository;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.root.GeneratedRootPlan;
import com.altvil.aro.service.optimization.root.OptimizedRootPlan;
import com.altvil.aro.service.optimization.root.RootOptimizationService;
import com.altvil.aro.service.optimization.root.RootPlanningService;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;
import com.altvil.aro.service.processing.ProcessingLayerService;

@Service
public class RootOptimizationServiceImpl implements RootOptimizationService {

	private static final Logger log = LoggerFactory
			.getLogger(RootOptimizationServiceImpl.class.getName());

	private ProcessingLayerService processingLayerService;
	private RootPlanRepository rootPlanRepository;
	private MasterPlanRepository masterPlanRepository;
	private OptimizationPlannerService optimizationPlannerService;
	private RootPlanningService rootPlanningService;

	@Autowired
	public RootOptimizationServiceImpl(
			ProcessingLayerService processingLayerService,
			RootPlanRepository rootPlanRepository,
			MasterPlanRepository masterPlanRepository,
			OptimizationPlannerService optimizationPlannerService,
			RootPlanningService rootPlanningService) {
		super();
		this.processingLayerService = processingLayerService;
		this.rootPlanRepository = rootPlanRepository;
		this.masterPlanRepository = masterPlanRepository;
		this.optimizationPlannerService = optimizationPlannerService;
		this.rootPlanningService = rootPlanningService;
	}

	@Override
	public OptimizedRootPlan optimize(RootOptimizationRequest request) {

		Collection<MasterPlan> masterPlans = toMasterPlans(
				request.getPlanId(),
				getServiceLayers(request.getProcessingLayers(), request
						.getNetworkDataRequest().getLocationEntities()));

		Collection<MasterOptimizationRequest> masterRequests = masterPlans
				.stream().map(request::toMasterOptimizationRequest)
				.collect(Collectors.toList());

		return doOptimize(request, masterRequests);

	}

	private OptimizedRootPlan doOptimize(
			RootOptimizationRequest rootOptimizationRequest,
			Collection<MasterOptimizationRequest> requests) {

		List<OptimizedMasterPlan> masterPlans = new ArrayList<>();
		requests.forEach(r -> {
			Future<OptimizedMasterPlan> f = optimizationPlannerService
					.optimize(r);
			try {
				masterPlans.add(f.get());
			} catch (Throwable err) {
				// TODO Communicate Failure
				log.error(err.getMessage(), err);
			}
		});

		return rootPlanningService.save(new GeneratedRootPlanImpl(
				rootOptimizationRequest, masterPlans));

	}

	private Collection<ServiceLayer> getServiceLayers(
			Collection<Integer> layerIds,
			Collection<LocationEntityType> entityTypes) {
		return (layerIds == null || layerIds.size() == 0) ? processingLayerService
				.getServiceLayers(layerIds) : processingLayerService
				.inferServiceLayers(entityTypes);
	}

	@Transactional
	private Collection<MasterPlan> toMasterPlans(long planId,
			Collection<ServiceLayer> serviceLayers) {
		RootPlan rootPlan = rootPlanRepository.findOne(planId);
		return masterPlanRepository.save(serviceLayers.stream().map(s -> {
			MasterPlan mp = new MasterPlan();

			mp.setName(s.getName() + ":" + rootPlan.getName());
			mp.setCentroid(rootPlan.getCentroid());
			mp.setAreaName(rootPlan.getAreaName());
			mp.setRootPlan(rootPlan);
			mp.setServiceLayer(s);
			mp.setCreateAt(new Date());
			mp.setUpdateAt(new Date());

			return mp;
		}).collect(Collectors.toList()));

	}

	private static class GeneratedRootPlanImpl implements GeneratedRootPlan {

		private RootOptimizationRequest optimizationRequest;
		private Collection<OptimizedMasterPlan> optimizedMasterPlans;

		public GeneratedRootPlanImpl(
				RootOptimizationRequest optimizationRequest,
				Collection<OptimizedMasterPlan> optimizedMasterPlans) {
			super();
			this.optimizationRequest = optimizationRequest;
			this.optimizedMasterPlans = optimizedMasterPlans;
		}

		@Override
		public RootOptimizationRequest getOptimizationRequest() {
			return optimizationRequest;
		}

		@Override
		public Collection<OptimizedMasterPlan> getOptimizedPlans() {
			return optimizedMasterPlans;
		}

	}

}
