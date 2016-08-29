package com.altvil.aro.service.optimization.root.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.MasterPlanRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.RootPlanRepository;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.impl.PlanCommandService;
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
	private NetworkPlanRepository networkPlanRepository;
	private PlanCommandService planCommandService;

	@Autowired
	public RootOptimizationServiceImpl(
			ProcessingLayerService processingLayerService,
			RootPlanRepository rootPlanRepository,
			MasterPlanRepository masterPlanRepository,
			OptimizationPlannerService optimizationPlannerService,
			RootPlanningService rootPlanningService,
			NetworkPlanRepository networkPlanRepository,
			PlanCommandService planCommandService) {
		super();
		this.processingLayerService = processingLayerService;
		this.rootPlanRepository = rootPlanRepository;
		this.masterPlanRepository = masterPlanRepository;
		this.optimizationPlannerService = optimizationPlannerService;
		this.rootPlanningService = rootPlanningService;
		this.networkPlanRepository = networkPlanRepository;
		this.planCommandService = planCommandService;
	}

	@Override
	public OptimizedRootPlan optimize(RootOptimizationRequest request) {

		networkPlanRepository.deleteChildPlans(request.getPlanId());

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

		//new MasterPlanOptimizationIterator(rootOptimizationRequest, ) ;
		
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
				.inferServiceLayers(entityTypes) : processingLayerService
				.getServiceLayers(layerIds);
	}

	@Transactional
	private Collection<MasterPlan> toMasterPlans(long planId,
			Collection<ServiceLayer> serviceLayers) {
		NetworkPlan rootPlan = networkPlanRepository.findOne(planId);
		return masterPlanRepository.save(serviceLayers.stream().map(s -> {
			MasterPlan mp = new MasterPlan();

			mp.setName(s.getName() + ":" + rootPlan.getName());
			mp.setCentroid(rootPlan.getCentroid());
			mp.setAreaName(rootPlan.getAreaName());
			mp.setParentPlan(rootPlan);
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

	private class MasterPlanOptimizationIterator implements
			Iterator<OptimizedMasterPlan> {

		private RootOptimizationRequest rootOptimizationRequest;
		private Iterator<MasterOptimizationRequest> optimizationRequestItr;
		private OptimizedMasterPlan previous = null;

		public MasterPlanOptimizationIterator(
				RootOptimizationRequest rootOptimizationRequest,
				Iterator<MasterOptimizationRequest> optimizationRequestItr) {
			super();
			this.rootOptimizationRequest = rootOptimizationRequest;
			this.optimizationRequestItr = optimizationRequestItr;
		}

		@Override
		public boolean hasNext() {
			return optimizationRequestItr.hasNext();
		}

		@Override
		public OptimizedMasterPlan next() {

			MasterOptimizationRequest masterReqiest = optimizationRequestItr
					.next();

			// Update Transitively "Previous Master Plan Fiber"
			if (previous != null) {
				planCommandService.updatePlanConduit(previous,
						masterReqiest.getNetworkDataRequest());
			}

			// Submit Optimization Of Master Plan
			Future<OptimizedMasterPlan> f = optimizationPlannerService
					.optimize(masterReqiest);

			// Block until Optimization Complete
			try {
				previous = f.get();
				return previous;
			} catch (Throwable err) {
				// TODO Communicate Failure
				log.error(err.getMessage(), err);
				return null;
			}
		}

	}

}
