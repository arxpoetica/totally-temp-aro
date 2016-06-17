package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResolveContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class TimesStreamFunction extends AbstractStreamFunction {

	private CurveIdentifier lhs;
	private CurveIdentifier rhs;

	private StreamAccessor lhsAccessor;
	private StreamAccessor rhsAccessor;
	
	public TimesStreamFunction(CurveIdentifier lhs, CurveIdentifier rhs) {
		super();
		this.lhs = lhs;
		this.rhs = rhs;
	}

	@Override
	public double calc(CalcContext ctx) {
		return lhsAccessor.getValue(ctx.getResultStream())
				* rhsAccessor.getValue(ctx.getResultStream());
	}

	@Override
	public void resolve(ResolveContext ctx) {
		lhsAccessor = ctx.getStreamAccessor(lhs) ;
		rhsAccessor = ctx.getStreamAccessor(rhs) ;
	}

}
