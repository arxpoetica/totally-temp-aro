package com.altvil.aro.service.planing;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkPlanData;
import com.altvil.aro.model.PlanLocationLink;
import com.altvil.aro.service.conversion.EquipmentLocationMapping;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.interfaces.FiberCableConstructionType;

public interface WirecenterNetworkPlan {

	long getPlanId();

	Collection<NetworkNode> getNetworkNodes();

	Collection<FiberRoute> getFiberRoutes();
		
	DemandCoverage getDemandCoverage();

	Collection<EquipmentLocationMapping> getEquipmentLocationMappings() ;
	
	Set<FiberCableConstructionType> getFiberCableConstructionTypes() ;
	double getFiberLengthInMeters(FiberCableConstructionType fiberType);
	
	Collection<NetworkPlanData> getNetworkPlanData() ;
	Collection<PlanLocationLink> getPlanLocationLinks() ;
	

}
