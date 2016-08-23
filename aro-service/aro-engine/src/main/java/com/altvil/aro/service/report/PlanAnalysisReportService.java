package com.altvil.aro.service.report;

import com.altvil.aro.service.optimization.master.GeneratedMasterPlan;
import com.altvil.aro.service.optimization.root.GeneratedRootPlan;

public interface PlanAnalysisReportService {
	
	PlanAnalysisReport createPlanAnalysisReport() ;
	PlanAnalysisReport createPlanAnalysisReport(GeneratedPlan generatedPlan) ;
	//TODO Make Aggregators Generic
	PlanAnalysisReport aggregate(GeneratedMasterPlan plan) ;
	PlanAnalysisReport aggregate(GeneratedRootPlan rootPlan) ;

}
