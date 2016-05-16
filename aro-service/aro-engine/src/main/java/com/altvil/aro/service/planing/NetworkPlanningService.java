package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.concurrent.Future;

import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.aro.service.planning.fiber.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.impl.AbstractOptimizationPlan;
import com.altvil.aro.service.planning.optimization.OptimizationPlanConfiguration;

public interface NetworkPlanningService {

	void save(WirecenterNetworkPlan plan);

	Future<WirecenterNetworkPlan> planFiber(FiberPlanConfiguration<? extends AbstractFiberPlan> fiberPlan,
			FiberNetworkConstraints constraints);
	
	
	JobService.Builder<WirecenterNetworkPlan> optimizeWirecenter(Principal requestor, OptimizationPlanConfiguration<OptimizationPlan> fiberPlan, FiberNetworkConstraints constraints) ;


	MasterPlanCalculation optimizeMasterFiber(OptimizationPlanConfiguration<OptimizationPlan> fiberPlan, FiberNetworkConstraints constraints) ;
	
	MasterPlanBuilder planMasterFiber(Principal requestor, FiberPlanConfiguration<? extends AbstractFiberPlan> fiberPlan, FiberNetworkConstraints constraints);
}
