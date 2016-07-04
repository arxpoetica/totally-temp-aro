package com.altvil.aro.service.roic.analysis.builder.config.spi;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.builder.config.CurveConfig;


public interface SpiCurveRegistry<T, S extends SpiCurveRegistry<T, S>> {
	
	S add(CurveConfig<T> config) ;
	Collection<CurveConfig<T>> getCurveConfigs() ;
	

}
