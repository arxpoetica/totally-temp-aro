package com.altvil.aro.service.demand.analysis.model;

import java.util.Collection;

import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.demand.analysis.spi.FairShareDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public interface FairShareDemandAnalysis {

	LocationEntityType getLocationEntityType();

	Collection<ProductDemand> getProductDemands();
	FairShareDemand createFairShareDemand(EntityDemandMapping mapping); 

}
