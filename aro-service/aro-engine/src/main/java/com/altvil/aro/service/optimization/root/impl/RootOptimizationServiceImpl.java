package com.altvil.aro.service.optimization.root.impl;

import java.util.Collection;
import java.util.Date;
import java.util.concurrent.Future;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.RootPlan;
import com.altvil.aro.model.ServiceLayer;
import com.altvil.aro.persistence.repository.MasterPlanRepository;
import com.altvil.aro.persistence.repository.RootPlanRepository;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimization.root.OptimizedRootPlan;
import com.altvil.aro.service.optimization.root.RootOptimizationService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;
import com.altvil.aro.service.processing.ProcessingLayerService;

@Service
public class RootOptimizationServiceImpl implements RootOptimizationService {

	private OptimizationExecutorService optimizationExecutorService;
	
	private ProcessingLayerService processingLayerService;
	private RootPlanRepository rootPlanRepository ;
	private MasterPlanRepository masterPlanRepository ;
	
	
	private OptimizationExecutor optimizationExecutor ;
	
	@PostConstruct
	void PostConstruct() {
		optimizationExecutorService.createOptimizationExecutor(ExecutorType.RootPlan) ;
	}

	@Override
	public Future<OptimizedRootPlan> optimize(RootOptimizationRequest request) {

		Collection<MasterPlan> masterPlans = toMasterPlans(request.getPlanId(), getServiceLayers(
				request.getProcessingLayers(), request.getNetworkDataRequest()
				.getLocationEntities())) ;
		
		Collection<MasterOptimizationRequest> masterRequests = masterPlans.stream().map(request::toMasterOptimizationRequest).collect(Collectors.toList()) ;
		
		return null;
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
		return masterPlanRepository.save(
		 serviceLayers.stream().map(s -> {
			MasterPlan mp = new MasterPlan();
			
			mp.setName(s.getName() + ":" + rootPlan.getName());
			mp.setCentroid(rootPlan.getCentroid());
			mp.setAreaName(rootPlan.getAreaName()) ;
			mp.setRootPlan(rootPlan);
			mp.setServiceLayer(s);
			mp.setCreateAt(new Date());
			mp.setUpdateAt(new Date());
			
			return mp;
		}).collect(Collectors.toList()));
	
	}

}
