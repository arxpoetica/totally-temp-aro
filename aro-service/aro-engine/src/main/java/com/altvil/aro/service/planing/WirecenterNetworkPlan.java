package com.altvil.aro.service.planing;

import java.util.Collection;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.network.PlanId;

public interface WirecenterNetworkPlan {

	PlanId getPlanId();

	Collection<NetworkNode> getNetworkNodes();

	Collection<FiberRoute> getFiberRoutes();

}
