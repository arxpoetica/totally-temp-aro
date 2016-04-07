package com.altvil.aro.service.optimize.model;

import java.util.Collection;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;

public interface DemandCoverage extends DemandStatistic {
	
	LocationDemand getLocationDemand() ;
	Collection<LocationEntity> getLocations();
}
