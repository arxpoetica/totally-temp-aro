package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class GrowthCurve extends AbstractStreamFunction {

	private double initialValue ;
	private double rate ;
	
	


	@Override
	public double calc(CalcContext ctx) {
		return initialValue * Math.pow(1+rate, ctx.getPeriod()) ;
	}

}
