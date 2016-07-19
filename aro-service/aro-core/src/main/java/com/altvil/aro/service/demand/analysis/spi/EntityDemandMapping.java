package com.altvil.aro.service.demand.analysis.spi;

import java.io.Serializable;

public interface EntityDemandMapping extends Serializable {

	
	double getMappedDemand() ;
	double getMappedRevenue() ;

	
}
