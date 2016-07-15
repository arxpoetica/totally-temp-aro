package com.altvil.aro.service.optimization.master;

import com.altvil.aro.service.report.SummarizedPlan;

public interface OptimizedMasterPlan extends SummarizedPlan{

	GeneratedMasterPlan getGeneratedMasterPlan() ;
	
}
