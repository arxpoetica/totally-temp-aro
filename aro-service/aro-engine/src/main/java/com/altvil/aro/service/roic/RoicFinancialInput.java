package com.altvil.aro.service.roic;

import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;

public interface RoicFinancialInput {

	double getFixedCosts() ;
	NetworkDemandSummary getDemandSummary() ;
	
}
