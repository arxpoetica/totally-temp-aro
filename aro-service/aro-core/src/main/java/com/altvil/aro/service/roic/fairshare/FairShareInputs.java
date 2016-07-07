package com.altvil.aro.service.roic.fairshare;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;
import com.altvil.aro.service.roic.provider.impl.DefaultNetworkCapability;

public class FairShareInputs {

	public static Builder build() {
		return new Builder();
	}

	public static class Builder {

		private FairShareInputs inputs = new FairShareInputs();

		public Builder setProvider(NetworkProvider provider, Double strength,
				Set<NetworkType> supportedTypes) {

			inputs.providerCapability = new DefaultNetworkCapability(provider,
					strength, supportedTypes);
			return this;
		}

		public Builder setProvider(NetworkProvider provider,
				Map<NetworkType, Double> brandStrengths,
				Map<NetworkType, Double> networkStrength) {

			inputs.providerCapability = new DefaultNetworkCapability(provider,
					brandStrengths, networkStrength);
			return this;
		}

		public Builder setProvider(NetworkProvider provider,
				Map<NetworkType, Double> strengthMap,
				Set<NetworkType> supportedTypes) {
			inputs.providerCapability = new DefaultNetworkCapability(provider,
					strengthMap, supportedTypes);
			return this;
		}

		public Builder setDemographicModifier(double modifier) {
			inputs.demographicModifier = modifier;
			return this;
		}

		public Builder setProvider(NetworkCapability capability) {
			inputs.providerCapability = capability;
			return this;
		}

		public Builder addCompetitor(NetworkCapability capability) {
			inputs.competitorNetworkCapabilities.add(capability);
			return this;
		}

		public Builder setNetworkTypes(NetworkTypeShare share) {
			inputs.networkTypeShare = share;
			return this;
		}

		public Builder add(NetworkProvider provider, Double strength,
				Set<NetworkType> supportedTypes) {
			addCompetitor(new DefaultNetworkCapability(provider, strength,
					supportedTypes));
			return this;
		}

		public Builder addCompetitor(NetworkProvider provider,
				Map<NetworkType, Double> brandStrengths,
				Map<NetworkType, Double> networkStrength) {
			addCompetitor(new DefaultNetworkCapability(provider,
					brandStrengths, networkStrength));
			return this;
		}

		public Builder setProviderPenetration(NetworkType type,
				Double pentrationPercent) {
			inputs.providerPenetrationByType.put(type, pentrationPercent);
			return this;
		}

		public FairShareInputs build() {

			if (inputs.networkTypeShare == null
					|| inputs.providerCapability == null) {
				throw new NullPointerException();
			}

			return inputs;
		}

	}

	// Variables
	private NetworkTypeShare networkTypeShare;
	private NetworkCapability providerCapability;
	private Map<NetworkType, Double> providerPenetrationByType = new EnumMap<>(
			NetworkType.class);
	private double demographicModifier = 1.0;
	private Collection<NetworkCapability> competitorNetworkCapabilities = new ArrayList<>();

	// Network Types
	public NetworkTypeShare getNetworkTypeShare() {
		return networkTypeShare;
	}

	public NetworkCapability getProviderCapability() {
		return providerCapability;
	}

	public Collection<NetworkCapability> getCompetitorNetworkCapabilities() {
		return competitorNetworkCapabilities;
	}

	public double getDemographicModifier() {
		return demographicModifier;
	}

	public Double getCurrentPenetration(NetworkType type) {
		return providerPenetrationByType.get(type);
	}

}
