package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.spi.ResolveContext;

public class StreamDiff extends AbstractStreamFunction {

	private CurveIdentifier id;

	private double previousValue = 0;
	private StreamAccessor valueAccessor;

	public StreamDiff(CurveIdentifier id) {
		super();
		this.id = id;
	}

	@Override
	public double calc(CalcContext ctx) {

		double val = valueAccessor.getValue(ctx.getResultStream());
		double diff = (ctx.getPeriod() > 0) ? val - previousValue : 0;
		previousValue = val;
		return diff;
	}

	@Override
	public void resolve(ResolveContext ctx) {
		valueAccessor = ctx.getStreamAccessor(id);
	}

}
