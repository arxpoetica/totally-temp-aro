package com.altvil.aro.service.roic;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.CurveIdentifier;

public interface RoicModel {
	
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	Collection<AnalysisRow> getAnalysisRow() ;
	
}
