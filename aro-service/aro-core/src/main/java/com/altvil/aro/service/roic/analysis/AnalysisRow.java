package com.altvil.aro.service.roic.analysis;


public interface AnalysisRow {
	
	double[] getRawData() ;
	int getSize() ;
	double getValue(int period) ;
	
	
}
