package com.altvil.aro.service.planing;

import java.util.concurrent.Future;

import com.altvil.aro.service.job.Job;
import com.altvil.aro.service.job.JobService;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.InputRequests;

public interface NetworkPlanningService {

	void save(WirecenterNetworkPlan plan);

	Future<WirecenterNetworkPlan> planFiber(long planId,
			FiberNetworkConstraints constraints);
	
	
	Future<WirecenterNetworkPlan> optimizeWirecenter(long planId,
			InputRequests inputRequests, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;

	Job<WirecenterNetworkPlan> optimizeWirecenter$(JobService jobService, long planId,
			InputRequests inputRequests, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;


	MasterPlanCalculation optimizeMasterFiber(long planId,
			InputRequests inputRequests, OptimizationInputs optimizationInputs, FiberNetworkConstraints constraints) ;
	
	MasterPlanCalculation planMasterFiber(long planId,
			InputRequests inputRequests, FiberNetworkConstraints constraints);
	MasterPlanCalculation$ planMasterFiber$(JobService jobService, long planId,
			InputRequests inputRequests, FiberNetworkConstraints constraints);

}
