package com.altvil.aro.service.roic.analysis.calc;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface StreamModel extends RoicAnalysis {
	
	Collection<CurveIdentifier>  getCurveIdentifiers() ;
	
	AnalysisPeriod getAnalysisPeriod() ;
	
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	Collection<AnalysisRow> getAnalysisRow() ;
	
	StreamModel add(Collection<StreamModel> other) ;
	StreamModel add(StreamModel other) ;
	StreamModel minus(StreamModel other) ;
	StreamModel mask(Set<CurveIdentifier> ids) ;
	
	
}
