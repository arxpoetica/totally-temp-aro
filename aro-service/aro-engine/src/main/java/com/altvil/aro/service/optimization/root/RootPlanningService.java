package com.altvil.aro.service.optimization.root;


//TODO create AggregatePlanningService
public interface RootPlanningService {

	OptimizedRootPlan save(GeneratedRootPlan plan) ;

	OptimizedRootPlan createOptimizedPlan(GeneratedRootPlan generatedMasterPlan);

	OptimizedRootPlan save(OptimizedRootPlan op);

	
}
