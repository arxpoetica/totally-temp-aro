package com.altvil.aro.service.optimization.master;

import java.util.concurrent.Future;


public interface OptimizationPlannerService {
	
	Future<MasterOptimizationResponse> optimize(MasterOptimizationRequest request) ;

}
