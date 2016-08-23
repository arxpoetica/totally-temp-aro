package com.altvil.aro.service.optimization.root;


public interface RootPlanningService {

	OptimizedRootPlan save(GeneratedRootPlan plan) ;

	OptimizedRootPlan createOptimizedMasterPlan(GeneratedRootPlan generatedMasterPlan);

	OptimizedRootPlan save(OptimizedRootPlan op);

	
}
