package com.altvil.aro.service.planing;

import java.util.concurrent.Future;

import com.altvil.aro.service.plan.FiberNetworkConstraints;

public interface NetworkPlanningService {

	void save(WirecenterNetworkPlan plan);

	Future<WirecenterNetworkPlan> planFiber(long planId,
			FiberNetworkConstraints constraints);

	MasterPlanCalculation planMasterFiber(long planId,
			FiberNetworkConstraints constraints);

}
