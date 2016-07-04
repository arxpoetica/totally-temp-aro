package com.altvil.aro.service.roic.analysis.builder.component.impl;


public class NetworkComponentAssembler  {
	/*
	private OldDerivedComponent derivedComponent;
	private double fixedCost;
	private Collection<CurveIdentifier> exportededIds ;
	
	public NetworkComponentAssembler(AnalysisPeriod period,
			OldDerivedComponent derivedComponent, double fixedCost, Collection<CurveIdentifier> exportededIds) {
		super(period);
		this.derivedComponent = derivedComponent;
		this.fixedCost = fixedCost;
		this.exportededIds = exportededIds ;
	}
	
	@Override
	protected void assembleCurves() {
		for(CurveIdentifier id : exportededIds) {
			aggregateCurves(id) ;
		}
		
		aggregateCurves(AnalysisCode.revenue, AnalysisCode.new_connections_cost,
				AnalysisCode.opex_expenses, AnalysisCode.maintenance_expenses,
				AnalysisCode.premises_passed, AnalysisCode.subscribers_count,
				AnalysisCode.subscribers_penetration,
				AnalysisCode.houseHolds_global_count);

		add(AnalysisCode.cost, Op.constCurveTruncated(fixedCost, 1));

		add(AnalysisCode.penetration, Op.divide(
				AnalysisCode.subscribers_penetration,
				AnalysisCode.houseHolds_global_count));

		add(AnalysisCode.cashflow, Op.cashFlow(AnalysisCode.revenue,
				AnalysisCode.maintenance_expenses, AnalysisCode.opex_expenses,
				AnalysisCode.new_connections_cost, AnalysisCode.cost));
	}

	protected void assignOutputs() {
		addOutput(AnalysisCode.cost);
		addOutput(AnalysisCode.revenue);
		addOutput(AnalysisCode.maintenance_expenses);
		addOutput(AnalysisCode.opex_expenses);
		addOutput(AnalysisCode.new_connections_cost);
		addOutput(AnalysisCode.cashflow);
		addOutput(AnalysisCode.premises_passed);
		addOutput(AnalysisCode.subscribers_count);
		addOutput(AnalysisCode.subscribers_penetration);
		addOutput(AnalysisCode.houseHolds_global_count);
		addOutput(AnalysisCode.cost);
	}
	
	protected void aggregateCurves(CurveIdentifier... ids) {
		for (CurveIdentifier id : ids) {
			add(id,
					Op.constCurve(derivedComponent.computeAnalysisRow(id)));
			//addOutput(id) ;
		}
	}*/
	

}
