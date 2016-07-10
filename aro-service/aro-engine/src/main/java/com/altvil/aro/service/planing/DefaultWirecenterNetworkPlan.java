package com.altvil.aro.service.planing;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.conversion.EquipmentLocationMapping;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.impl.DefaultFiberCoverage;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public class DefaultWirecenterNetworkPlan implements WirecenterNetworkPlan {

	private long planId;
	private Collection<NetworkNode> networkNodes;
	private Collection<FiberRoute> fiberRoutes;
	private DemandCoverage demandCoverage ;
	private Map<FiberType, Double> fiberLengthMap ;
	private Collection<EquipmentLocationMapping> equipmentLocationMappings ;

	public DefaultWirecenterNetworkPlan(long planId,
			Collection<NetworkNode> networkNodes,
			Collection<FiberRoute> fiberRoutes,
			DemandCoverage demandCoverage,
			Collection<EquipmentLocationMapping> equipmentLocationMappings,
			Map<FiberType, Double> fiberLengthMap) {
		super();
		this.planId = planId;
		this.networkNodes = networkNodes;
		this.fiberRoutes = fiberRoutes;
		this.demandCoverage = demandCoverage == null ? DefaultFiberCoverage.accumulate().getResult() : demandCoverage;
		this.equipmentLocationMappings =equipmentLocationMappings ;
		this.fiberLengthMap = fiberLengthMap == null ? Collections.emptyMap() : fiberLengthMap ;
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
	public DemandCoverage getDemandCoverage() {
		return demandCoverage ;
	}

	@Override
	public Collection<EquipmentLocationMapping> getEquipmentLocationMappings() {
		return equipmentLocationMappings ;
	}	
	

}
