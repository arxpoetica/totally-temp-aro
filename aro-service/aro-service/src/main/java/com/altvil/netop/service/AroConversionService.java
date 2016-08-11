package com.altvil.netop.service;

import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.netop.model.AroPlanAnalysisReport;

public interface AroConversionService {

	AroPlanAnalysisReport toAroPlanAnalysisReport(PlanAnalysisReport planAnalysisReport);

}
