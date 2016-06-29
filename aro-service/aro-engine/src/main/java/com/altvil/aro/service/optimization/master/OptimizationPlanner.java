package com.altvil.aro.service.optimization.master;

import com.altvil.aro.service.optimization.spi.OptimizationExecutor;

public interface OptimizationPlanner {
	
	void planWireCenterOptimizations() ;
	void optimizeWireCenters(OptimizationExecutor executor) ;
	void optimizeMasterPlan() ;
	

}
