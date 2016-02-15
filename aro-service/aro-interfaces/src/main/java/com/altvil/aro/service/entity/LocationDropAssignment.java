package com.altvil.aro.service.entity;

public interface LocationDropAssignment extends AroEntity {

	LocationEntity getLocationEntity();

	CoverageAggregateStatistic getAggregateStatistic() ;
	
	double getDropLength();
	DropCable getDropCable() ;
	
}
