package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.model.NetworkType;

public interface PeriodAnalysis {
	
	int getPeriodInMonths() ;
	NetworkType getNetworkType() ;
	
	RowReference getPenetration() ;
	
	double getTotalCashFlow() ;
	double getDiscountedCashFlow() ;

}
