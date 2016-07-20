package com.altvil.aro.service.roic;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilder;

public interface RoicInputService {

	CashFlows createCashFlows(SpeedCategory speedCategory,
			NetworkFinancialInput finacialInputs, int years);

	RoicBuilder createRoicBuilder(PlanAnalysisReport planAnalysisReport);

}
