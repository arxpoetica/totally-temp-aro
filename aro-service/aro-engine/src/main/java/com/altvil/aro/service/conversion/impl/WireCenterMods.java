package com.altvil.aro.service.conversion.impl;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.conversion.PlanModifications;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.plan.BasicFinanceEstimator;
import com.altvil.aro.service.planing.DefaultWirecenterNetworkPlan;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;
import com.altvil.aro.service.planing.impl.NetworkPlanningServiceImpl;

public class WireCenterMods implements PlanModifications<WirecenterNetworkPlan> {


	private static final Logger log = LoggerFactory
			.getLogger(WireCenterMods.class.getName());

	
	private long planId;

	private List<NetworkNode> networkNodes = new ArrayList<>();
	private List<FiberRoute> fiberRoutes = new ArrayList<FiberRoute>();
	private LocationDemand locationDemand = null ;
	private Map<FiberType, Double> fiberLengthMap ; 

	public WireCenterMods(long planId) {
		super();
		this.planId = planId;
	}

	@Override
	public PlanModifications<WirecenterNetworkPlan> addEquipment(
			NetworkNode update) {
		networkNodes.add(update);
		return this;
	}

	@Override
	public PlanModifications<WirecenterNetworkPlan> addFiber(FiberRoute update) {
		fiberRoutes.add(update);
		return this;
	}
	
	

	@Override
	public PlanModifications<WirecenterNetworkPlan> setLocationDemand(LocationDemand locationDemand) {
		this.locationDemand = locationDemand ;
		return this ;
	}
	
	

	@Override
	public PlanModifications<WirecenterNetworkPlan> setFiberLengths(
			Map<FiberType, Double> map) {
		this.fiberLengthMap = map ;
		return this ;
	}

	@Override
	public WirecenterNetworkPlan commit() {
		LocationDemand ld = locationDemand;
		Map<FiberType, Double> flm = fiberLengthMap;
		
		log.info("Real FEEEDER " + fiberLengthMap.get(FiberType.FEEDER));
		log.info("Real DIST " + fiberLengthMap.get(FiberType.DISTRIBUTION));
		
		BasicFinanceEstimator estimator = NetworkPlanningServiceImpl.FINANCE_ESTIMATOR.get();
		if (estimator != null) {
			flm = new EnumMap<>(FiberType.class);
			for (FiberType ft : FiberType.values()) {
				flm.put(ft, 0.0);
			}
			//Must be either DISTRIBUTION or FEEDER for SimpleNetworkFinancials to sum it.
			flm.put(FiberType.DISTRIBUTION, estimator.getLength());
			log.info("HACKED DIST " +  estimator.getLength());
		}

		return new DefaultWirecenterNetworkPlan(planId, networkNodes, fiberRoutes, ld, flm);
	}

}
