package com.altvil.aro.service.roic.analysis.builder.config;

import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface CurveConfig<T> {

	CurveIdentifier getCurveIdentifier() ;
	StreamFunction bindFunction(T param) ;
	
}
