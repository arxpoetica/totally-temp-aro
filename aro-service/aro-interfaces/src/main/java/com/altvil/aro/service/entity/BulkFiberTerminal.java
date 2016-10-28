package com.altvil.aro.service.entity;


public interface BulkFiberTerminal extends EquipmentLinker  {

	LocationEntity getLocationEntity() ;
	AssignedEntityDemand getAssignedEntityDemand() ;
	double getTotalFiberDemand() ;
	
}
