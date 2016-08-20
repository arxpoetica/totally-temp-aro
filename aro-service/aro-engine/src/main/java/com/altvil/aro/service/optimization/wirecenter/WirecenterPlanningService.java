package com.altvil.aro.service.optimization.wirecenter;

import com.altvil.aro.service.optimization.OptimizedPlan;
import com.altvil.aro.service.report.GeneratedPlan;

public interface WirecenterPlanningService {
	
	OptimizedPlan summarize(GeneratedPlan generatedPlan) ;
	void save(OptimizedPlan optimizedPlan) ;
	void save(GeneratedPlan generatedPlan) ;

}
