package com.altvil.aro.service.network;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.planning.NetworkConfiguration;

public interface NetworkService {
		NetworkData getNetworkData(NetworkConfiguration networkConfiguration);
}
