package com.altvil.aro.service.entity;


public interface LocationEntityDemand {
	
	LocationEntityType getEntityType() ;
	double getDemand() ;
	LocationEntityDemand add(double other) ;
	LocationEntityDemand add(LocationEntityDemand other) ;

}
