package com.altvil.aro.service.roic.analysis.model.curve;


public interface AnalysisRow {
	
	double[] getRawData() ;
	int getSize() ;
	double getValue(int period) ;
	
	
}
