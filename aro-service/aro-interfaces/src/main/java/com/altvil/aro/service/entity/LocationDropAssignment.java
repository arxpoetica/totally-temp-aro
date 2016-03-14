package com.altvil.aro.service.entity;

public interface LocationDropAssignment extends AroEntity {

	LocationEntity getLocationEntity();

	LocationDemand getAggregateStatistic() ;
	
	double getDropLength();
	DropCable getDropCable() ;
	
}
