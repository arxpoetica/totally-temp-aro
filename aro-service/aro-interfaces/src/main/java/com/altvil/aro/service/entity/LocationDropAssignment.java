package com.altvil.aro.service.entity;

public interface LocationDropAssignment extends AroEntity {

	AssignedEntityDemand getAssignedEntityDemand() ;
	LocationEntity getLocationEntity();
	//LocationDemand getAggregateStatistic() ;
	
	double getDropLength();
	DropCable getDropCable() ;
	
}
