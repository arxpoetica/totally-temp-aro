package com.altvil.aro.service.roic.analysis.builder.config.impl;

import java.util.function.Function;

import com.altvil.aro.service.roic.analysis.builder.config.CurveConfig;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class DefaultCurveConfig<T> implements CurveConfig<T> {

	private CurveIdentifier id;
	private Function<T, StreamFunction> f;

	public DefaultCurveConfig(CurveIdentifier id, Function<T, StreamFunction> f) {
		super();
		this.id = id;
		this.f = f;
	}

	@Override
	public CurveIdentifier getCurveIdentifier() {
		return id;
	}

	@Override
	public StreamFunction bindFunction(T param) {
		return f.apply(param);
	}

}
