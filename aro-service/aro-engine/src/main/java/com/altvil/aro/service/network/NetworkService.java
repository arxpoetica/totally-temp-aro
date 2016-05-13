package com.altvil.aro.service.network;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.model.NetworkStrategy;
import com.altvil.aro.service.strategy.NoSuchStrategy;

public interface NetworkService {
		 NetworkData getNetworkData(NetworkRequest networkRequest) ;
	
		 NetworkStrategy getNetworkStrategy(NetworkStrategyRequest request) throws NoSuchStrategy;
}
