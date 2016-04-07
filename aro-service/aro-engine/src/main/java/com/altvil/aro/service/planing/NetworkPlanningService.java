package com.altvil.aro.service.planing;

import java.util.concurrent.Future;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.InputRequests;

public interface NetworkPlanningService {

	void save(WirecenterNetworkPlan plan);

	Future<WirecenterNetworkPlan> planFiber(long planId,
			FiberNetworkConstraints constraints);
	
	
	Future<WirecenterNetworkPlan> optimizeWirecenter(long planId,
			InputRequests inputRequests, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;


	MasterPlanCalculation optimizeMasterFiber(long planId,
			InputRequests inputRequests, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;
	
	MasterPlanCalculation planMasterFiber(long planId,
			InputRequests inputRequests, FiberNetworkConstraints constraints);

}
