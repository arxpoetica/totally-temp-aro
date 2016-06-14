package com.altvil.aro.service.roic.analysis.spi;

import com.altvil.aro.service.roic.analysis.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;

public interface ResolveContext {
	
	StreamAccessor getStreamAccessor(CurveIdentifier id) ;

}
