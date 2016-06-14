package com.altvil.aro.service.roic.analysis.spi;

import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;

public interface ResolveContext {
	
	StreamAccessor getStreamAccessor(CurveIdentifier id) ;

}
