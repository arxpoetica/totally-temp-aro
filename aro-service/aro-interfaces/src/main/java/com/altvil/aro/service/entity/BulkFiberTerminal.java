package com.altvil.aro.service.entity;

import java.util.Collection;

public interface BulkFiberTerminal extends AroEntity {

	Collection<LocationEntityDemand> getLocationEntityDemands() ;
	double getTotalFiberDemand() ;
	
}
