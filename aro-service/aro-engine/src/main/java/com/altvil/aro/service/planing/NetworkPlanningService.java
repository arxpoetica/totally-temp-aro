package com.altvil.aro.service.planing;

import java.security.Principal;
import java.util.concurrent.Future;

import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.fiber.strategies.FiberPlanConfiguration;
import com.altvil.aro.service.planning.optimization.strategies.OptimizationPlanConfiguration;

public interface NetworkPlanningService {

	Future<WirecenterNetworkPlan> planFiber(FiberPlanConfiguration fiberPlan,
			FtthThreshholds constraints, GlobalConstraint globalConstraint);
	
	JobService.JobRequest<WirecenterNetworkPlan> optimizeWirecenter(Principal requestor, OptimizationPlanConfiguration fiberPlan, FtthThreshholds constraints) ;

	MasterPlanBuilder optimizeMasterFiber(Principal requestor, OptimizationPlanConfiguration fiberPlan, FtthThreshholds constraints) throws InterruptedException ;
	
	MasterPlanBuilder planMasterFiber(Principal requestor, FiberPlanConfiguration fiberPlanConfiguration, FtthThreshholds constraints, GlobalConstraint globalConstraint) throws InterruptedException;
}
