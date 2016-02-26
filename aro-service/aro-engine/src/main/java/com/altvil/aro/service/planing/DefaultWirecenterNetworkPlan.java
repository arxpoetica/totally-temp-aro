package com.altvil.aro.service.planing;

import java.util.Collection;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;

public class DefaultWirecenterNetworkPlan implements WirecenterNetworkPlan {

	private int planId;
	private Collection<NetworkNode> networkNodes;
	private Collection<FiberRoute> fiberRoutes;

	public DefaultWirecenterNetworkPlan(int planId,
			Collection<NetworkNode> networkNodes,
			Collection<FiberRoute> fiberRoutes) {
		super();
		this.planId = planId;
		this.networkNodes = networkNodes;
		this.fiberRoutes = fiberRoutes;
	}

	@Override
	public int getPlanId() {
		return planId;
	}

	@Override
	public Collection<NetworkNode> getNetworkNodes() {
		return networkNodes;
	}

	@Override
	public Collection<FiberRoute> getFiberRoutes() {
		return fiberRoutes;
	}

}
