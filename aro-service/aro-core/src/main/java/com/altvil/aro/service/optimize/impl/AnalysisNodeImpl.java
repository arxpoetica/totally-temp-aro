package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public class AnalysisNodeImpl implements AnalysisNode {

	private DemandCoverage demandCoverage;
	private double capex;
	private double successBasedCapex;
	private double score;
	
	public static final AnalysisNode ZERO_IDENTITY = new AnalysisNodeImpl(DefaultFiberCoverage.EMPTY_COVERAGE, 0,0,0) ;

	public AnalysisNodeImpl(DemandCoverage demandCoverage, double capex,
							double successBasedCapex,
							double score) {
		super();
		this.demandCoverage = demandCoverage;
		this.capex = capex;
		this.successBasedCapex = successBasedCapex;
		this.score = score;
	}

	public AnalysisNodeImpl(AnalysisNode node) {
		this(node.getFiberCoverage(), node.getCapex(), node
				.getSuccessBasedCapex(), node
				.getScore());
	}

	@Override
	public DemandCoverage getFiberCoverage() {
		return demandCoverage;
	}

	@Override
	public double getCapex() {
		return capex;
	}

	@Override
	public double getSuccessBasedCapex() {
		return successBasedCapex;
	}


	@Override
	public double getScore() {
		return score;
	}



}