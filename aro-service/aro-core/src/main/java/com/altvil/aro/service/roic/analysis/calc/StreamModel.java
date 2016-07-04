package com.altvil.aro.service.roic.analysis.calc;

import java.util.Collection;
import java.util.Set;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;
import com.altvil.aro.service.roic.analysis.model.curve.AnalysisRow;
import com.altvil.aro.service.roic.analysis.model.curve.RowReference;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface StreamModel extends RoicAnalysis {
	
	Collection<CurveIdentifier>  getCurveIdentifiers() ;
	
	AnalysisPeriod getAnalysisPeriod() ;
	
	AnalysisRow getAnalysisRow(CurveIdentifier id) ;
	Collection<AnalysisRow> getAnalysisRow() ;
	Collection<RowReference> getCurveReferences() ;
	
	StreamAssembler modify() ;
	
	StreamModel mask(Set<CurveIdentifier> ids) ;
	StreamModel notIn(Set<CurveIdentifier> ids) ;
	
	
}
