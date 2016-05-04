package com.altvil.aro.service.roic;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;

public interface RoicModel {
	
	double getDiscountedRevenue() ;
	Collection<AnalysisRow> getAnalysisRow() ;
	
}
