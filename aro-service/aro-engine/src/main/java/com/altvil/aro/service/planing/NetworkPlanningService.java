package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.concurrent.Future;

import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;

public interface NetworkPlanningService {

	void save(WirecenterNetworkPlan plan);

	Future<WirecenterNetworkPlan> planFiber(FiberPlanConfiguration fiberPlan,
			FiberNetworkConstraints constraints);
	
	
	JobService.Builder<WirecenterNetworkPlan> optimizeWirecenter(Principal requestor, OptimizationPlanConfiguration fiberPlan, FiberNetworkConstraints constraints) ;


	MasterPlanCalculation optimizeMasterFiber(OptimizationPlanConfiguration fiberPlan, FiberNetworkConstraints constraints) ;
	
	MasterPlanBuilder planMasterFiber(Principal requestor, FiberPlanConfiguration fiberPlan, FiberNetworkConstraints constraints);
}
