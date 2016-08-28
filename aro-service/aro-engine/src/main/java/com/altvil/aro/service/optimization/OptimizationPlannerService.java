package com.altvil.aro.service.optimization;

import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;

public interface OptimizationPlannerService {

	Future<OptimizedMasterPlan> optimize(MasterOptimizationRequest request);

}
