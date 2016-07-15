package com.altvil.aro.service.optimization;

import com.altvil.aro.service.report.GeneratedPlan;
import com.altvil.aro.service.report.SummarizedPlan;

public interface OptimizedPlan extends SummarizedPlan {

	GeneratedPlan getGeneratedPlan() ;

}
