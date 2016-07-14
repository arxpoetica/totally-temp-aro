package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.service.optimize.model.DemandCoverage;


public interface NetworkDemandSummary {
	
	Collection<DemandTypeEnum> getDemandTypes() ;
	NetworkDemand getNetworkDemand(DemandTypeEnum type) ;
	DemandCoverage getDemandCoverage() ;
	
}
