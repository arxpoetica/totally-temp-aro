package com.altvil.aro.service.roic.analysis.spi;

import com.altvil.aro.service.roic.RoicModel;
import com.altvil.aro.service.roic.analysis.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;

public interface StreamAssembler {
	
	StreamAssembler setPeriod(int period) ;
	
	StreamAssembler add(CurveIdentifier id, StreamFunction f) ;
	
	StreamAssembler addOutput(CurveIdentifier id) ;
	
	RoicModel resolveAndBuild() ;
	

}
