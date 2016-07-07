package com.altvil.aro.service.roic.provider.impl;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.provider.NetworkCapability;

public class DefaultNetworkCapability implements NetworkCapability {

	private final NetworkProvider networkProvider;
	private final Map<NetworkType, Double> strengthMap;
	private final Map<NetworkType, Double> brandStrength;

	public DefaultNetworkCapability(NetworkProvider networkProvider,
			Map<NetworkType, Double> brandStrength,
			Map<NetworkType, Double> providerStrength) {
		super();
		this.networkProvider = networkProvider;
		this.brandStrength = brandStrength;
		this.strengthMap = providerStrength;
	}

	public DefaultNetworkCapability(NetworkProvider networkProvider,
			double strength, Set<NetworkType> supportedNetworks) {
		this(networkProvider, createBrandStrength(supportedNetworks),
				createStrengthMap(strength));
	}
	
	public DefaultNetworkCapability(NetworkProvider networkProvider,
			Map<NetworkType, Double> strengthMap,
			 Set<NetworkType> supportedNetworks) {
		this(networkProvider, createBrandStrength(supportedNetworks),
				strengthMap);
	}

	@Override
	public double getProviderStrength(NetworkType type) {
		Double val = strengthMap.get(type);
		return val == null ? 1 : val;
	}

	@Override
	public NetworkProvider getNetworkProvider() {
		return networkProvider;
	}

	@Override
	public double getNetworkStrength(NetworkType type) {
		Double val = brandStrength.get(type);
		return val == null ? 0 : val ;

	}

	@Override
	public double getEffectiveNetworkStrength(NetworkType type) {
		return getNetworkStrength(type) * getProviderStrength(type);
	}

	@Override
	public Set<NetworkType> getNetworkTypes() {
		return brandStrength.keySet();
	}

	private static Map<NetworkType, Double> createBrandStrength(
			Set<NetworkType> set) {
		Map<NetworkType, Double> map = new EnumMap<>(NetworkType.class);
		for (NetworkType nt : set) {
			map.put(nt, 1.0);
		}
		return map;
	}

	private static Map<NetworkType, Double> createStrengthMap(double value) {
		Map<NetworkType, Double> map = new EnumMap<>(NetworkType.class);

		Double val = value;

		for (NetworkType t : NetworkType.values()) {
			map.put(t, val);
		}

		return map;

	}

}
