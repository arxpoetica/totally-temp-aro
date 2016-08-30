package com.altvil.aro.service.optimization.spi;


public interface OptimizationExecutorService {
	
	public enum ExecutorType {
		Wirecenter, MasterPlan, RootPlan
	}
	
	OptimizationExecutor createOptimizationExecutor(ExecutorType type) ;

}
