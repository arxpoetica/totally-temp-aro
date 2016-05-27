package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.concurrent.Future;

import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.NetworkConfiguration;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;

public interface NetworkPlanningService {

	Future<WirecenterNetworkPlan> planFiber(FiberPlanConfiguration fiberPlan,
			FiberNetworkConstraints constraints);
	
	JobService.JobRequest<WirecenterNetworkPlan> optimizeWirecenter(Principal requestor, OptimizationPlanConfiguration fiberPlan, FiberNetworkConstraints constraints) ;

	MasterPlanBuilder optimizeMasterFiber(Principal requestor, OptimizationPlanConfiguration fiberPlan, FiberNetworkConstraints constraints) throws InterruptedException ;
	
	MasterPlanBuilder planMasterFiber(Principal requestor, FiberPlanConfiguration fiberPlanConfiguration, FiberNetworkConstraints constraints) throws InterruptedException;
}
