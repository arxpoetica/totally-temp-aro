package com.altvil.aro.service.demand;

import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.entity.LocationEntityType;


public interface DemandMapping {
	
	EntityDemandMapping getEntityDemandMapping(LocationEntityType type) ;

}
