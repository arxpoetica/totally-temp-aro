package com.altvil.aro.service.roic.provider;

import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;

public interface NetworkCapability {
	
	double getProviderStrength() ;
	NetworkProvider getNetworkProvider() ;
	double getNetworkStrength(NetworkType type) ;
	double getEffectiveNetworkStrength(NetworkType type) ;
	Set<NetworkType> getNetworkTypes() ;
	
	
	
}
