package com.altvil.aro.service.network;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.planning.NetworkConfiguration;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;

public interface NetworkService {
		NetworkData getNetworkData(NetworkConfiguration networkConfiguration);
}
