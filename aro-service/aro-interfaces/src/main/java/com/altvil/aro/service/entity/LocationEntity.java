package com.altvil.aro.service.entity;



public interface LocationEntity extends AroEntity {
	
	int getCensusBlockId() ;
	double getCompetitiveStrength() ;
	LocationDemand getLocationDemand();

}
