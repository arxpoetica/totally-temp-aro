package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class TruncatedConstantStream extends AbstractStreamFunction {

	private double constValue;
	private int truncatedAt;

	public TruncatedConstantStream(double constValue, int truncatedAt) {
		super();
		this.constValue = constValue;
		this.truncatedAt = truncatedAt;
	}

	@Override
	public double calc(CalcContext ctx) {
		return ctx.getPeriod() < truncatedAt ? constValue : 0;
	}

}
