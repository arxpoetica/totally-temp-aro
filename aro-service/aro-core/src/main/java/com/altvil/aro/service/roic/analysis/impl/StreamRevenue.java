package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResultStream;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;
import com.altvil.aro.service.roic.analysis.key.CurveIdentifier;
import com.altvil.aro.service.roic.analysis.spi.ResolveContext;

public class StreamRevenue implements StreamFunction {

	private CurveIdentifier hhId;
	private CurveIdentifier penetrationId;
	private CurveIdentifier arpuIdentifier;

	private StreamAccessor houseHoldAccessor;
	private StreamAccessor penetrationAccessor;
	private StreamAccessor arpuAccessor;

	public StreamRevenue(CurveIdentifier hhId, CurveIdentifier penetrationId,
			CurveIdentifier arpuIdentifier) {
		super();
		this.hhId = hhId;
		this.penetrationId = penetrationId;
		this.arpuIdentifier = arpuIdentifier;
	}

	@Override
	public void resolve(ResolveContext ctx) {
		houseHoldAccessor = ctx.getStreamAccessor(hhId);
		penetrationAccessor = ctx.getStreamAccessor(penetrationId);
		arpuAccessor = ctx.getStreamAccessor(arpuIdentifier);
	}

	@Override
	public double calc(CalcContext ctx) {
		ResultStream rs = ctx.getResultStream();
		
		
		return houseHoldAccessor.getValue(rs)
				* penetrationAccessor.getValue(rs) * arpuAccessor.getValue(rs);
	}
}
