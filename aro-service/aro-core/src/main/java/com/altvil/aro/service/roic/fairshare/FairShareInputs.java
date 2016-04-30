package com.altvil.aro.service.roic.fairshare;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;
import com.altvil.aro.service.roic.provider.impl.DefaultNetworkCapability;

public class FairShareInputs {
	
	public static class Builder {
		
		private FairShareInputs inputs = new FairShareInputs() ;
		
		public Builder setProvider(NetworkProvider provider, Double strength, Set<NetworkType> supportedTypes) {
			inputs.providerCapability  = new DefaultNetworkCapability(provider, strength, supportedTypes) ;
			return this ;
		}
		
		public Builder setNetworkTypes(NetworkTypeShare share) {
			inputs.networkTypeShare = share ;
			return this ;
		}
		
		public Builder add(NetworkProvider provider, Double strength, Set<NetworkType> supportedTypes) {
			inputs.competitorNetworkCapabilities.add(new DefaultNetworkCapability(provider, strength, supportedTypes)) ;
			return this ;
		}
		
	}
	
	
	//Variables
	private NetworkTypeShare networkTypeShare;
	private NetworkCapability providerCapability;
	private Collection<NetworkCapability> competitorNetworkCapabilities = new ArrayList<>();

	//Network Types
	public NetworkTypeShare getNetworkTypeShare() {
		return networkTypeShare;
	}

	public NetworkCapability getProviderCapability() {
		return providerCapability;
	}

	public Collection<NetworkCapability> getCompetitorNetworkCapabilities() {
		return competitorNetworkCapabilities;
	}

}
