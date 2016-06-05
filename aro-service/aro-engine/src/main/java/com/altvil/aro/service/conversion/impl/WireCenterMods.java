package com.altvil.aro.service.conversion.impl;

import java.util.ArrayList;
import java.util.List;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.conversion.PlanModifications;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.planing.DefaultWirecenterNetworkPlan;
import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public class WireCenterMods implements PlanModifications<WirecenterNetworkPlan> {

	private long planId;

	private List<NetworkNode> networkNodes = new ArrayList<>();
	private List<FiberRoute> fiberRoutes = new ArrayList<FiberRoute>();
	private LocationDemand locationDemand = null ;

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
	public WirecenterNetworkPlan commit() {
		return new DefaultWirecenterNetworkPlan(planId, networkNodes,
				fiberRoutes, locationDemand);
	}

}
