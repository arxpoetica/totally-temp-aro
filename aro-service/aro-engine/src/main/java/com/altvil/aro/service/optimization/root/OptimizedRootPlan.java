package com.altvil.aro.service.optimization.root;

import java.util.Collection;

import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.report.SummarizedPlan;

public interface OptimizedRootPlan extends SummarizedPlan {
	
	Collection<OptimizedMasterPlan> getOptimizedMasterPlan();

}
