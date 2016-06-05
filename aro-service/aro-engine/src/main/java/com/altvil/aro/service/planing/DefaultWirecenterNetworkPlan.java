package com.altvil.aro.service.planing;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;

public class DefaultWirecenterNetworkPlan implements WirecenterNetworkPlan {

	private long planId;
	private Collection<NetworkNode> networkNodes;
	private Collection<FiberRoute> fiberRoutes;
	private LocationDemand locationDemand ;
	private Map<FiberType, Double> fiberLengthMap ;

	public DefaultWirecenterNetworkPlan(long planId,
			Collection<NetworkNode> networkNodes,
			Collection<FiberRoute> fiberRoutes,
			LocationDemand locationDemand,
			Map<FiberType, Double> fiberLengthMap) {
		super();
		this.planId = planId;
		this.networkNodes = networkNodes;
		this.fiberRoutes = fiberRoutes;
		this.locationDemand = locationDemand ;
		this.fiberLengthMap = fiberLengthMap ;
	}
	
	@Override
	public Double getFiberLengthInMeters(FiberType fiberType) {
		Double length = fiberLengthMap.get(fiberType) ;
		return length == null ? 0 : length ;
	}

	@Override
	public long getPlanId() {
		return planId;
	}

	@Override
	public Collection<NetworkNode> getNetworkNodes() {
		return networkNodes;
	}

	@Override
	public Collection<FiberRoute> getFiberRoutes() {
		return fiberRoutes;
	}

	@Override
	public LocationDemand getTotalDemand() {
		return locationDemand ;
	}

	
	

}
