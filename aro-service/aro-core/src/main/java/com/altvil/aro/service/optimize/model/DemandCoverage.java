package com.altvil.aro.service.optimize.model;

import com.altvil.aro.service.entity.CoverageAggregateStatistic;
import com.altvil.aro.service.entity.LocationEntity;

import java.util.Collection;

public interface DemandCoverage {

	public CoverageAggregateStatistic getCoverage();

	public Collection<LocationEntity> getLocations() ;
}
