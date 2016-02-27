package com.altvil.aro.service.planing.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.altvil.aro.persistence.repository.FiberRouteRepository;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.service.planing.NetworkPlanningService;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

@Service
public class NetworkPlanningServiceImpl implements NetworkPlanningService {

	@Autowired
	private NetworkNodeRepository networkNodeRepository;

	@Autowired
	private FiberRouteRepository fiberRouteRepository;

	@Override
	@Transactional
	public void save(WirecenterNetworkPlan plan) {
		networkNodeRepository.save(plan.getNetworkNodes());
		fiberRouteRepository.save(plan.getFiberRoutes());
	}

}
