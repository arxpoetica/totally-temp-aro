package com.altvil.aro.service.optimization.root;

import com.altvil.aro.service.report.SummarizedPlan;

public interface OptimizedRootPlan extends SummarizedPlan {
	
	GeneratedRootPlan getGeneratedRootPlan();

}
