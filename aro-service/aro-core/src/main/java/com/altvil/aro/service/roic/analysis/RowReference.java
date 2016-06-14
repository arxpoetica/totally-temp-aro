package com.altvil.aro.service.roic.analysis;

import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface RowReference {
	
	CurveIdentifier getIdentifier() ;
	AnalysisRow getAnalysisRow() ;

}
