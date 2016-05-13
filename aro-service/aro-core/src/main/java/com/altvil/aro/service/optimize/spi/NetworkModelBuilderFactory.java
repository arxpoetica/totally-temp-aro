package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public interface NetworkModelBuilderFactory {

	public NetworkModelBuilder create(NetworkData networkData, NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration,
			FiberNetworkConstraints fiberConstraints);

}
