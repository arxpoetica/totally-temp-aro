package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public interface NetworkModelBuilderFactory {

	public NetworkModelBuilder create(NetworkData networkData, NetworkConfiguration networkConfiguration,
			FiberNetworkConstraints fiberConstraints);

}
