package com.altvil.aro.service.optimization;

import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.master.MasterOptimizationAnalysis;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;

public interface OptimizationPlannerService {

	Future<MasterOptimizationAnalysis> optimize(
			MasterOptimizationRequest request);

}
