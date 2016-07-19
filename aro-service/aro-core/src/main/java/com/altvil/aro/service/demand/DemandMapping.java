package com.altvil.aro.service.demand;

import java.io.Serializable;

import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.entity.LocationEntityType;


public interface DemandMapping extends Serializable {
	
	EntityDemandMapping getEntityDemandMapping(LocationEntityType type) ;

}
