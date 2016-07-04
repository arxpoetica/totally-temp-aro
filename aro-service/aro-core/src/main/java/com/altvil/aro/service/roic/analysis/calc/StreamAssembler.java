package com.altvil.aro.service.roic.analysis.calc;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface StreamAssembler {
	
	StreamAssembler add(StreamModel sm) ;
	
	StreamAssembler setAnalysisPeriod(AnalysisPeriod period);
	
	StreamAssembler add(CurveIdentifier id, StreamFunction f) ;
	
	StreamAssembler addOutput(CurveIdentifier id) ;
	
	StreamModel resolveAndBuild() ;
	

}
