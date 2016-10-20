package com.altvil.aro.service.entity;


public interface BulkFiberTerminal extends AroEntity {

	boolean hasDemandFor(LocationEntityType type) ;
	LocationEntity getLocationEntity() ;
	AssignedEntityDemand getAssignedEntityDemand() ;
	double getTotalFiberDemand() ;
	
}
