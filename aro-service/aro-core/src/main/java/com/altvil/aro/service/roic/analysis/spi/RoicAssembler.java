package com.altvil.aro.service.roic.analysis.spi;

import com.altvil.aro.service.roic.RoicModel;
import com.altvil.aro.service.roic.analysis.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;

public interface RoicAssembler {
	
	RoicAssembler setStartYear(int startYear) ;
	
	RoicAssembler setPeriod(int period) ;
	
	RoicAssembler add(CurveIdentifier id, StreamFunction f) ;
	
	RoicAssembler addOutput(CurveIdentifier id) ;
	
	RoicModel resolveAndBuild() ;
	

}
