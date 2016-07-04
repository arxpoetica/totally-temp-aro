package com.altvil.aro.service.roic.analysis.model.curve;

import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;


public interface RowReference {
	
	CurveIdentifier getIdentifier() ;
	AnalysisRow getAnalysisRow() ;

}
