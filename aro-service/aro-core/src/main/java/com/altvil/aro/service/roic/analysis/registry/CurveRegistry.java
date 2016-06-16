package com.altvil.aro.service.roic.analysis.registry;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.AnalysisRow;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;


public interface CurveRegistry {

	String getNameSpace() ;
	AnalysisRow getAnalysisRow(CurvePath path) ;
	CurveRegistry getCurveRegistry(CurvePath path) ;
	Collection<CurveRegistry> getCurveRegestries() ;
	Collection<CurveIdentifier> getCurveIdentifiers() ;
	
	
}
