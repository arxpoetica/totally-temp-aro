package com.altvil.aro.service.roic.analysis.builder.config.spi;

import java.util.function.Function;

import com.altvil.aro.service.roic.analysis.builder.config.ComponentConfig;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public interface SpiComponentConfig<T> extends ComponentConfig<T> {

	void add(CurveIdentifier id, Function<T, StreamFunction> f) ;
	void addOutput(CurveIdentifier id) ;

}
