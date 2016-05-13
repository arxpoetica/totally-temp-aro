package com.altvil.aro.service.network.impl;

import com.altvil.annotation.Strategy;
import com.altvil.aro.service.graph.model.NetworkStrategy;
import com.altvil.aro.service.network.NetworkStrategyFactory;
import com.altvil.aro.service.network.NetworkStrategyRequest;

@Strategy(type=NetworkStrategyFactory.class, name="SCALAR")
public class ScalarNetworkStrategyFactory implements NetworkStrategyFactory {

	@Override
	public NetworkStrategy getNetworkStrategy(NetworkStrategyRequest request) {
		return new ScalarNetworkStrategy();
	}

	public static class ScalarNetworkStrategy implements NetworkStrategy {
			}
}
