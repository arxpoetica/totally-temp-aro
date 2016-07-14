package com.altvil.aro.service.planing;

import java.util.Collection;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.conversion.EquipmentLocationMapping;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public interface WirecenterNetworkPlan {

	long getPlanId();

	Collection<NetworkNode> getNetworkNodes();

	Collection<FiberRoute> getFiberRoutes();
		
	DemandCoverage getDemandCoverage();

	Collection<EquipmentLocationMapping> getEquipmentLocationMappings() ;
	
	Double getFiberLengthInMeters(FiberType fiberType);

}
