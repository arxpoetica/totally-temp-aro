package com.altvil.aro.service.conversion;

import java.util.Collection;

import com.altvil.aro.service.conversion.impl.NetworkNodeAssembler;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.DemandStatistic;

public interface EquipmentLocationMapping {
	
	DemandStatistic getDemandStatistic() ;
	NetworkNodeAssembler getNodeAssembler() ;
	Collection<AssignedEntityDemand> getAssignedEntityDemands() ;

}
