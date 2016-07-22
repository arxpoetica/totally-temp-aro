package com.altvil.aro.service.report;

import com.altvil.aro.service.optimization.master.GeneratedMasterPlan;

public interface PlanAnalysisReportService {
	
	PlanAnalysisReport createPlanAnalysisReport() ;
	PlanAnalysisReport createPlanAnalysisReport(GeneratedPlan generatedPlan) ;
	PlanAnalysisReport aggregate(GeneratedMasterPlan plam) ;

}
