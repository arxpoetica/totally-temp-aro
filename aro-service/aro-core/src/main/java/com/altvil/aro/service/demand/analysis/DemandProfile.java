package com.altvil.aro.service.demand.analysis;

import java.util.Collection;

import com.altvil.aro.service.roic.model.NetworkType;

public interface DemandProfile {
	
	

	 Collection<NetworkType> getSupportedNetworks() ;
	 double getPenetration(NetworkType type) ;
	 double getWeight(NetworkType networkType, SpeedCategory category) ;
	
}
