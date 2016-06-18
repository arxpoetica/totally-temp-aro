package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResolveContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class ValueTimesConstantOp extends AbstractStreamFunction {

	private CurveIdentifier id;
	private double constantValue;

	private StreamAccessor valueAccessor;

	public ValueTimesConstantOp(CurveIdentifier id, double constantValue) {
		super();
		this.id = id;
		this.constantValue = constantValue;
	}

	@Override
	public void resolve(ResolveContext ctx) {
		valueAccessor = ctx.getStreamAccessor(id);
	}

	@Override
	public double calc(CalcContext ctx) {
		return valueAccessor.getValue(ctx.getResultStream()) * constantValue;
	}

}
