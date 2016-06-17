package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class GrowthCurve extends AbstractStreamFunction {

	private double initialValue;
	private double rate;

	public GrowthCurve(double initialValue, double rate) {
		super();
		this.initialValue = initialValue;
		this.rate = rate;
	}

	@Override
	public double calc(CalcContext ctx) {
		return initialValue * Math.pow(1 + rate, ctx.getPeriod());
	}

}
