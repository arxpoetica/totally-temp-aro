package com.altvil.aro.service.entity;


public interface BulkFiberTerminal extends AroEntity {

	LocationEntity getLocationEntity() ;
	AssignedEntityDemand getAssignedEntityDemand() ;
	double getTotalFiberDemand() ;
	
}
