package com.altvil.aro.service.roic.analysis.calc;

import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface ResolveContext {
	
	StreamAccessor getStreamAccessor(CurveIdentifier id) ;

}
