package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.concurrent.Future;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.network.PlanId;
import com.altvil.aro.service.plan.FiberNetworkConstraints;

public interface NetworkPlanningService {

	void save(WirecenterNetworkPlan plan);

	Future<WirecenterNetworkPlan> planFiber(PlanId planId, NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration,
			FiberNetworkConstraints constraints);
	
	
	JobService.Builder<WirecenterNetworkPlan> optimizeWirecenter(Principal requestor, PlanId planId,
			NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;


	MasterPlanCalculation optimizeMasterFiber(PlanId planId,
			NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;
	
	MasterPlanBuilder planMasterFiber(Principal requestor, PlanId planId,
			NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration, FiberNetworkConstraints constraints);
}
