package com.altvil.aro.service.optimization.wirecenter;

import java.util.Collection;

import com.altvil.aro.model.DemandTypeEnum;


public interface NetworkDemandSummary {
	Collection<NetworkDemand> getNetworkDemands() ;
	NetworkDemand getNetworkDemand(DemandTypeEnum type) ;
	
}
