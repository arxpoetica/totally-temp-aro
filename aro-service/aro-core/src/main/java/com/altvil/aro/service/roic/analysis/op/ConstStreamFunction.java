package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class ConstStreamFunction extends AbstractStreamFunction {

	private double constValue;

	public ConstStreamFunction(double constValue) {
		super();
		this.constValue = constValue;
	}

	@Override
	public double calc(CalcContext ctx) {
		return constValue;
	}

}
