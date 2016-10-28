package com.altvil.aro.service.planing;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkPlanData;
import com.altvil.aro.model.PlanLocationLink;
import com.altvil.aro.service.conversion.EquipmentLocationMapping;
import com.altvil.aro.service.optimize.impl.DefaultFiberCoverage;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.interfaces.FiberCableConstructionType;

public class DefaultWirecenterNetworkPlan implements WirecenterNetworkPlan {

	private long planId;
	private Collection<NetworkNode> networkNodes;
	private Collection<FiberRoute> fiberRoutes;
	private DemandCoverage demandCoverage;
	private Map<FiberCableConstructionType, Double> fiberLengthMap;
	private Collection<EquipmentLocationMapping> equipmentLocationMappings;
	private Collection<NetworkPlanData> networkPlanData;
	private Collection<PlanLocationLink> locationLinks;

	public DefaultWirecenterNetworkPlan(long planId,
			Collection<NetworkNode> networkNodes,
			Collection<FiberRoute> fiberRoutes, DemandCoverage demandCoverage,
			Collection<EquipmentLocationMapping> equipmentLocationMappings,
			Map<FiberCableConstructionType, Double> fiberLengthMap,
			Collection<NetworkPlanData> networkPlanData,
			Collection<PlanLocationLink> locationLinks) {
		super();
		this.planId = planId;
		this.networkNodes = networkNodes;
		this.fiberRoutes = fiberRoutes;
		this.demandCoverage = demandCoverage == null ? DefaultFiberCoverage
				.accumulate().getResult() : demandCoverage;
		this.equipmentLocationMappings = equipmentLocationMappings;
		this.fiberLengthMap = fiberLengthMap == null ? Collections.emptyMap()
				: fiberLengthMap;
		this.networkPlanData = networkPlanData;
		this.locationLinks = locationLinks;
	}

	@Override
	public double getFiberLengthInMeters(FiberCableConstructionType fiberType) {
		Double length = fiberLengthMap.get(fiberType);
		return length == null ? 0 : length;
	}

	@Override
	public Set<FiberCableConstructionType> getFiberCableConstructionTypes() {
		return fiberLengthMap.keySet();
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
		return demandCoverage;
	}

	@Override
	public Collection<EquipmentLocationMapping> getEquipmentLocationMappings() {
		return equipmentLocationMappings;
	}

	@Override
	public Collection<NetworkPlanData> getNetworkPlanData() {
		return networkPlanData;
	}

	@Override
	public Collection<PlanLocationLink> getPlanLocationLinks() {
		return locationLinks;
	}

}
