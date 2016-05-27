package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.CoverageOptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class CoverageOptimizationPlanImpl extends AbstractOptimizationPlan implements CoverageOptimizationPlan {
	private double coverage;
	
	protected CoverageOptimizationPlanImpl() {
		super(OptimizationType.COVERAGE);
	}

	public double getCoverage() {
		return coverage;
	}

	public void setCoverage(double coverage) {
		this.coverage = coverage;
	}
}
