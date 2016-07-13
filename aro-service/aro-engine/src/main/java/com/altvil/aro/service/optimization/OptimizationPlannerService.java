package com.altvil.aro.service.optimization;

import java.util.Collection;
import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.master.MasterOptimizationAnalysis;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;

public interface OptimizationPlannerService {

	Future<String> bulkOptimize(Collection<String> wireCenterIds, MasterOptimizationRequest request) ;
	
	Future<MasterOptimizationAnalysis> optimize(
			MasterOptimizationRequest request);

}
