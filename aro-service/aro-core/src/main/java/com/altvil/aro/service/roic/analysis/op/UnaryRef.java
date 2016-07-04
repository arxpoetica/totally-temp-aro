package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResolveContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public abstract class UnaryRef extends AbstractStreamFunction {

	private CurveIdentifier id;
	private StreamAccessor valueAccessor;

	public UnaryRef(CurveIdentifier id) {
		super();
		this.id = id;
	}

	@Override
	public void resolve(ResolveContext ctx) {
		valueAccessor = ctx.getStreamAccessor(id);
	}

	@Override
	public double calc(CalcContext ctx) {
		return doCalc(valueAccessor.getValue(ctx.getResultStream()));
	}

	protected abstract double doCalc(double val);

}
