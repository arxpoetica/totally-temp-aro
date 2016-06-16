package com.altvil.aro.service.roic;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface StreamModel {
	
	Collection<CurveIdentifier>  getCurveIdentifiers() ;
	
	AnalysisPeriod getAnalysisPeriod() ;
	
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	Collection<AnalysisRow> getAnalysisRow() ;
	
	StreamModel add(Collection<StreamModel> other) ;
	StreamModel add(StreamModel other) ;
	StreamModel minus(StreamModel other) ;
	StreamModel mask(Set<CurveIdentifier> ids) ;
	
	
}
