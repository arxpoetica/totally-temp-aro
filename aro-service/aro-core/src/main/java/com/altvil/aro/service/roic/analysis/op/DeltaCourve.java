package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;

public class DeltaCourve extends AbstractStreamFunction {

	private StreamAccessor lhs ;
	private StreamAccessor rhs ;
	
	
	@Override
	public double calc(CalcContext ctx) {
		return lhs.getValue(ctx.getResultStream()) - rhs.getValue(ctx.getResultStream()) ;
	}

}
