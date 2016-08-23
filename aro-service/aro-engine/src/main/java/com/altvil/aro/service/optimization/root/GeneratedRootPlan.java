package com.altvil.aro.service.optimization.root;

import java.util.Collection;

import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.wirecenter.RootOptimizationRequest;

public interface GeneratedRootPlan {
	
	RootOptimizationRequest getOptimizationRequest() ;
	Collection<OptimizedMasterPlan> getOptimizedPlans() ;


}
