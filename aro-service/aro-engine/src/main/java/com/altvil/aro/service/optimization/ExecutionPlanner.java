package com.altvil.aro.service.optimization;

import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.enumerations.AlgorithmType;
import com.google.common.base.Supplier;

public interface ExecutionPlanner {
	
	public Supplier<Future<OptimizedMasterPlan>> createPlan(MasterOptimizationRequest request) ;
	public Supplier<Future<OptimizedMasterPlan>> createPlan(AlgorithmType type, MasterOptimizationRequest request) ;

}
