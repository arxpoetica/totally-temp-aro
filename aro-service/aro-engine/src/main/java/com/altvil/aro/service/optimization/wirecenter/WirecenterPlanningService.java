package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.report.GeneratedPlan;

public interface WirecenterPlanningService {
	
	OptimizedPlan save(GeneratedPlan generatedPlan) ;
	OptimizedPlan optimizedPlan(GeneratedPlan generatedPlan) ;
	OptimizedPlan save(OptimizedPlan optimizedPlan) ;

}
