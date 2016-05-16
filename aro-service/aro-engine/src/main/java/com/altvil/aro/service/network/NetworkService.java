package com.altvil.aro.service.network;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.model.NetworkStrategy;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.strategy.NoSuchStrategy;

public interface NetworkService {
		NetworkData getNetworkData(FiberPlanConfiguration fiberPlanStrategy);
}
