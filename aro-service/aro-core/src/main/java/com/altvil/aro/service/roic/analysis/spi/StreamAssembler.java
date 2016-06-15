package com.altvil.aro.service.roic.analysis.spi;

import com.altvil.aro.service.roic.StreamModel;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface StreamAssembler {
	
	StreamAssembler setStartYear(int startYear) ;
	
	StreamAssembler setPeriod(int period) ;
	
	StreamAssembler add(CurveIdentifier id, StreamFunction f) ;
	
	StreamAssembler addOutput(CurveIdentifier id) ;
	
	StreamModel resolveAndBuild() ;
	

}
