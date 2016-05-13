package com.altvil.aro.service.planing;

import java.util.Collection;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.network.PlanId;

public class DefaultWirecenterNetworkPlan implements WirecenterNetworkPlan {

	private PlanId planId;
	private Collection<NetworkNode> networkNodes;
	private Collection<FiberRoute> fiberRoutes;

	public DefaultWirecenterNetworkPlan(PlanId planId,
			Collection<NetworkNode> networkNodes,
			Collection<FiberRoute> fiberRoutes) {
		super();
		this.planId = planId;
		this.networkNodes = networkNodes;
		this.fiberRoutes = fiberRoutes;
	}

	@Override
	public PlanId getPlanId() {
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
