package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;

import java.util.Collection;

public interface DemandCoverage {

	public LocationDemand getCoverage();

	public Collection<LocationEntity> getLocations() ;
}
