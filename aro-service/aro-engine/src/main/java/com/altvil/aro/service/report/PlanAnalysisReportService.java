package com.altvil.aro.service.report;

import java.util.Collection;

public interface PlanAnalysisReportService {
	
	PlanAnalysisReport createPlanAnalysisReport(GeneratedPlan generatedPlan) ;
	PlanAnalysisReport aggregate(Collection<PlanAnalysisReport> plans) ;

}
