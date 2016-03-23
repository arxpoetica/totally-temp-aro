package com.altvil.aro.service.entity;


public interface LocationEntityDemandByType {
	
	LocationEntityType getEntityType() ;
	double getDemand() ;
	LocationEntityDemandByType add(double other) ;
	LocationEntityDemandByType add(LocationEntityDemandByType other) ;

}
