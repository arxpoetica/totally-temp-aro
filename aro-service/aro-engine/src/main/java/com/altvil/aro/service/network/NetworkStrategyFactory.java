package com.altvil.aro.service.network;

import com.altvil.aro.service.graph.model.NetworkStrategy;

public interface NetworkStrategyFactory {
	NetworkStrategy getNetworkStrategy(NetworkStrategyRequest request);
}
