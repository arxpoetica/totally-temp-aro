package com.altvil.aro.service.optimization.wirecenter.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.service.optimization.wirecenter.WirecenterPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

@Service
public class WirecenterPlanningServiceImpl implements WirecenterPlanningService {

	private NetworkNodeRepository networkNodeRepository ;
	private FiberRouteRepository fiberRouteRepository ;
	
	
	@Autowired
	public WirecenterPlanningServiceImpl(
			NetworkNodeRepository networkNodeRepository,
			FiberRouteRepository fiberRouteRepository) {
		super();
		this.networkNodeRepository = networkNodeRepository;
		this.fiberRouteRepository = fiberRouteRepository;
	}



	@Override
	public void save(WirecenterNetworkPlan plan) {
		networkNodeRepository.save(plan.getNetworkNodes());
		fiberRouteRepository.save(plan.getFiberRoutes());

	}

	// @Transactional
	// private void saveUpdate(WirecenterNetworkPlan plan) {
	// networkNodeRepository.save(plan.getNetworkNodes());
	// fiberRouteRepository.save(plan.getFiberRoutes());
	// }

}
