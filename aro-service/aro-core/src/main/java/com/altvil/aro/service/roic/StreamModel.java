package com.altvil.aro.service.roic;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface StreamModel {
	
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	Collection<AnalysisRow> getAnalysisRow() ;
	
}
