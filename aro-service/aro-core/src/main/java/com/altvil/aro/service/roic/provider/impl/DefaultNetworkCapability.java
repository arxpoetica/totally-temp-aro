package com.altvil.aro.service.roic.provider.impl;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;

public class DefaultNetworkCapability implements NetworkCapability {
	
	private final NetworkProvider networkProvider ;
	private final Map<NetworkType, Double> providerStrengthMap ;
	private final Set<NetworkType> supportedNetworks ;
	
	public DefaultNetworkCapability(NetworkProvider networkProvider,
			Map<NetworkType, Double> providerStrength, Set<NetworkType> supportedNetworks) {
		super();
		this.networkProvider = networkProvider;
		this.providerStrengthMap = providerStrength;
		this.supportedNetworks = supportedNetworks;
	}
	
	public DefaultNetworkCapability(NetworkProvider networkProvider,
			double strength, Set<NetworkType> supportedNetworks) {
		this(networkProvider, createStrengthMap(strength), supportedNetworks) ;
	}

	@Override
	public double getProviderStrength(NetworkType type) {
		Double val = providerStrengthMap.get(type) ;
		return val == null ? 1: val ;
	}

	@Override
	public NetworkProvider getNetworkProvider() {
		return networkProvider ;
	}

	@Override
	public double getNetworkStrength(NetworkType type) {
		return supportedNetworks.contains(type) ? 1 : 0 ;
	}

	@Override
	public double getEffectiveNetworkStrength(NetworkType type) {
		return getNetworkStrength(type) * getProviderStrength(type) ;
	}

	@Override
	public Set<NetworkType> getNetworkTypes() {
		return supportedNetworks ;
	}
	
	

	private static Map<NetworkType, Double> createStrengthMap(double value) {
		Map<NetworkType, Double> map = new EnumMap<>(NetworkType.class) ;
		
		Double val = value ;
		
		for(NetworkType t : NetworkType.values()) {
			map.put(t,  val) ;
		}
		
		return map ;
		
	}

	

}
