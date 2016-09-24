package com.altvil.aro.service.roic.analysis.op;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.ResolveContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.registry.CurveIdentifier;

public class CashFlow extends AbstractStreamFunction {

	// Revenue - OpEx - Maintenance-CapEx - Connect-CapEx - Network-Capex

	private CurveIdentifier revenueId;
	private CurveIdentifier maintenanceId ;
	private CurveIdentifier opExId ;
	private CurveIdentifier newConnectionsId;
	private CurveIdentifier networkCostId;
	
	private StreamAccessor revenue;
	private StreamAccessor maintenance ;
	private StreamAccessor opEx ;
	private StreamAccessor newConnections;
	private StreamAccessor networkCost;
	
	
	public CashFlow(CurveIdentifier revenueId, CurveIdentifier maintenanceId,
			CurveIdentifier opExId, CurveIdentifier newConnectionsId,
			CurveIdentifier networkCostId) {
		super();
		this.revenueId = revenueId;
		this.maintenanceId = maintenanceId;
		this.opExId = opExId;
		this.newConnectionsId = newConnectionsId;
		this.networkCostId = networkCostId;
	}

	@Override
	public double calc(CalcContext ctx) {
		
		//Temp Roic fix to ensure cost in the first Period
		
		if( ctx.getPeriod() == 0 ) {
			return -networkCost.getValue(ctx.getResultStream()) ;
		}
		
		return revenue.getValue(ctx.getResultStream())
				- maintenance.getValue(ctx.getResultStream())
				- opEx.getValue(ctx.getResultStream())
				- newConnections.getValue(ctx.getResultStream());
	}

	@Override
	public void resolve(ResolveContext ctx) {
		revenue = ctx.getStreamAccessor(revenueId);
		maintenance = ctx.getStreamAccessor(maintenanceId);
		opEx = ctx.getStreamAccessor(opExId);
		newConnections = ctx.getStreamAccessor(newConnectionsId);
		networkCost =  ctx.getStreamAccessor(networkCostId);
		super.resolve(ctx);
	}

}
