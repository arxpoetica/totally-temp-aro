package com.altvil.aro.service.report;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;

public interface PlanAnalysisReportService {
	
	PlanAnalysisReport createPlanAnalysisReport() ;
	PlanAnalysisReport createPlanAnalysisReport(GeneratedPlan generatedPlan) ;
	PlanAnalysisReport aggregate(OptimizationConstraints constraints, Iterable<PlanAnalysisReport> reports) ;
	
}
