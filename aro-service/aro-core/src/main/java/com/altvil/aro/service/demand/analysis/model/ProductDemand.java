package com.altvil.aro.service.demand.analysis.model;

import com.altvil.aro.service.entity.LocationEntityType;

public interface ProductDemand {

	LocationEntityType getLocationEntityType();

	double getDemand();

}