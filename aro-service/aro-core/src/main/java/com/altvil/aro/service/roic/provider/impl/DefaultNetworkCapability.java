package com.altvil.aro.service.roic.provider.impl;

import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;

public class DefaultNetworkCapability implements NetworkCapability {
	
	private final NetworkProvider networkProvider ;
	private final double providerStrength ;
	private final Set<NetworkType> supportedNetworks ;
	
	public DefaultNetworkCapability(NetworkProvider networkProvider,
			double providerStrength, Set<NetworkType> supportedNetworks) {
		super();
		this.networkProvider = networkProvider;
		this.providerStrength = providerStrength;
		this.supportedNetworks = supportedNetworks;
	}

	@Override
	public double getProviderStrength() {
		return providerStrength ;
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
		return getNetworkStrength(type) * getProviderStrength() ;
	}

	@Override
	public Set<NetworkType> getNetworkTypes() {
		return supportedNetworks ;
	}

	

}
