package com.altvil.aro.service.demand.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationEntityType;

public interface EffectiveNetworkDemand extends RevenueProducer {

	LocationEntityType getLocationEntityType() ;
	Collection<ProductDemand> getProductDemands() ;
	
}
