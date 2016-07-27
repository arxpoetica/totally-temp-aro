package com.altvil.aro.service.roic;

import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.roic.analysis.model.RoicModel;

public interface RoicEngineService {

	CashFlows createCashFlows(SpeedCategory speedCategory,
			NetworkFinancialInput finacialInputs, int years);

	RoicModel loadRoicModel(RoicFinancialInput roicFinancialInput);

	CashFlows createRoicCashFlows(RoicFinancialInput roicFinancialInput);

}
