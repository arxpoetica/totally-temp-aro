package com.altvil.aro.service.optimization.master;


//TODO create AggregatePlanningService
public interface MasterPlanningService {
	
	OptimizedMasterPlan save(GeneratedMasterPlan plan) ;

	OptimizedMasterPlan createOptimizedMasterPlan(GeneratedMasterPlan generatedMasterPlan);

	OptimizedMasterPlan save(OptimizedMasterPlan op);

}
