package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;

public class ValueTimesConstantOp  extends AbstractStreamFunction {

	private StreamAccessor value ;
	private double constantValue ;
	
	
	@Override
	public double calc(CalcContext ctx) {
		return value.getValue(ctx.getResultStream()) * constantValue ;
	}

}
