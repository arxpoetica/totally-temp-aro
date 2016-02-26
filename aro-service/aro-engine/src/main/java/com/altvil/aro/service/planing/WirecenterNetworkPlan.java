package com.altvil.aro.service.planing;

import java.util.Collection;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;

public interface WirecenterNetworkPlan {

	int getPlanId();

	Collection<NetworkNode> getNetworkNodes();

	Collection<FiberRoute> getFiberRoutes();

}
