package com.altvil.aro.service.entity;


public interface LocationEntityDemand {
	
	LocationEntityType getEntityType() ;
	double getDemand() ;
	LocationEntityDemand add(LocationEntityDemand other) ;

}
