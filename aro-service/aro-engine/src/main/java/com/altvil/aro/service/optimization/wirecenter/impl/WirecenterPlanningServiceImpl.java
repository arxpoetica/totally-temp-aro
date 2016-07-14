package com.altvil.aro.service.optimization.wirecenter.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.service.cost.CostService;
import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;

@Service
public class WirecenterPlanningServiceImpl implements WirecenterPlanningService {

	private NetworkNodeRepository networkNodeRepository ;
	private FiberRouteRepository fiberRouteRepository ;
	private CostService costService ;
	
	@Autowired
	public WirecenterPlanningServiceImpl(
			NetworkNodeRepository networkNodeRepository,
			FiberRouteRepository fiberRouteRepository,
			CostService costService) {
		super();
		this.networkNodeRepository = networkNodeRepository;
		this.fiberRouteRepository = fiberRouteRepository;
		this.costService = costService ;
	}

	@Override
	public void save(OptimizedPlan plan) {
		networkNodeRepository.save(plan.getWirecenterNetworkPlan().getNetworkNodes());
		fiberRouteRepository.save(plan.getWirecenterNetworkPlan().getFiberRoutes());
		costService.updateWireCenterCosts(plan) ;
	}


}
