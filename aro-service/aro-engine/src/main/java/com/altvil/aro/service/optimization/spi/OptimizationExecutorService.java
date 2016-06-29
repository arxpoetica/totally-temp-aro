package com.altvil.aro.service.optimization.spi;


public interface OptimizationExecutorService {
	
	public enum ExecutorType {
		Wirecenter, MasterPlan
	}
	
	OptimizationExecutor createOptimizationExecutor(ExecutorType type) ;

}
