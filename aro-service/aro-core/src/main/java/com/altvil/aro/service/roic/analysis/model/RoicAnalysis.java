package com.altvil.aro.service.roic.analysis.model;

import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.registry.CurveRegistry;

public interface RoicAnalysis extends CurveRegistry {
	
	AnalysisPeriod getAnalysisPeriod() ;

}
