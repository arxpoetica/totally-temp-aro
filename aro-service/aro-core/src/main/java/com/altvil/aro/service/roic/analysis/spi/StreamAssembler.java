package com.altvil.aro.service.roic.analysis.spi;

import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface StreamAssembler {
	
	StreamAssembler setAnalysisPeriod(AnalysisPeriod period);
	
	StreamAssembler add(CurveIdentifier id, StreamFunction f) ;
	
	StreamAssembler addOutput(CurveIdentifier id) ;
	
	StreamModel resolveAndBuild() ;
	

}
