package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.CoverageOptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class CoverageOptimizationPlanImpl extends AbstractOptimizationPlan implements CoverageOptimizationPlan {
	private double coverage;
	
	public CoverageOptimizationPlanImpl() {
		super(OptimizationType.COVERAGE);
	}
	
	public CoverageOptimizationPlanImpl(double coverage) {
		this();
		this.coverage = coverage ;
	}

	public double getCoverage() {
		return coverage;
	}

	public void setCoverage(double coverage) {
		this.coverage = coverage;
	}
}
