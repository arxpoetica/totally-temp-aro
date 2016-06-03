package com.altvil.aro.service.planing;

import java.util.Collection;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;

public class DefaultWirecenterNetworkPlan implements WirecenterNetworkPlan {

	private long planId;
	private Collection<NetworkNode> networkNodes;
	private Collection<FiberRoute> fiberRoutes;
	private int atomicCount ;

	public DefaultWirecenterNetworkPlan(long planId,
			Collection<NetworkNode> networkNodes,
			Collection<FiberRoute> fiberRoutes,
			int atomicCount) {
		super();
		this.planId = planId;
		this.networkNodes = networkNodes;
		this.fiberRoutes = fiberRoutes;
		this.atomicCount = atomicCount ;
	}

	@Override
	public long getPlanId() {
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

	@Override
	public int getAtomicCount() {
		return atomicCount;
	}
	

}
