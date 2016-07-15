package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;

public interface GeneratedMasterPlan {
	
	MasterOptimizationRequest getOptimizationRequest() ;
	Collection<OptimizedPlan> getOptimizedPlans() ;

}
