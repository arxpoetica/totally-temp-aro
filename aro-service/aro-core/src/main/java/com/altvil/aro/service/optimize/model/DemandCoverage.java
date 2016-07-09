package com.altvil.aro.service.optimize.model;

import java.util.Collection;

import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;

public interface DemandCoverage extends DemandStatistic {
	
	LocationDemand getLocationDemand() ;
	
	double getRequiredFiberStrands(FiberType fiberType) ;
	Collection<AssignedEntityDemand> getAssignedEntityDemands();
	Collection<LocationEntity> getLocations() ;
}
