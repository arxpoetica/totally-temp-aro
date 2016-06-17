package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResolveContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class CashFlow extends AbstractStreamFunction {

	// Revenue - OpEx - Maintenance-CapEx - Connect-CapEx - Network-Capex

	private CurveIdentifier revenueId;
	private CurveIdentifier capexId;
	private CurveIdentifier connectCapexId;
	private CurveIdentifier networkCapexId;

	private StreamAccessor revenue;
	private StreamAccessor capex;
	private StreamAccessor connectCapex;
	private StreamAccessor networkCapex;

	public CashFlow(CurveIdentifier revenueId, CurveIdentifier capexId,
			CurveIdentifier connectCapexId, CurveIdentifier networkCapexId) {
		super();
		this.revenueId = revenueId;
		this.capexId = capexId;
		this.connectCapexId = connectCapexId;
		this.networkCapexId = networkCapexId;
	}

	@Override
	public double calc(CalcContext ctx) {
		return revenue.getValue(ctx.getResultStream())
				- capex.getValue(ctx.getResultStream())
				- connectCapex.getValue(ctx.getResultStream())
				- networkCapex.getValue(ctx.getResultStream());
	}

	@Override
	public void resolve(ResolveContext ctx) {
		revenue = ctx.getStreamAccessor(revenueId);
		capex = ctx.getStreamAccessor(capexId);
		connectCapex = ctx.getStreamAccessor(connectCapexId);
		networkCapex = ctx.getStreamAccessor(networkCapexId);
		super.resolve(ctx);
	}

}
