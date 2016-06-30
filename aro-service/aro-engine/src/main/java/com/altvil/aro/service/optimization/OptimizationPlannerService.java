package com.altvil.aro.service.optimization;

import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationResponse;

public interface OptimizationPlannerService {

	Future<MasterOptimizationResponse> optimize(
			MasterOptimizationRequest request);

}
