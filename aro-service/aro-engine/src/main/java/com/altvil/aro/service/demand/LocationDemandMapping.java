package com.altvil.aro.service.demand;

import com.altvil.aro.service.entity.LocationEntityType;

public interface LocationDemandMapping {
	
	double getRawLocationDemand(LocationEntityType type) ;
	double getRawRevenue(LocationEntityType type) ;

}
