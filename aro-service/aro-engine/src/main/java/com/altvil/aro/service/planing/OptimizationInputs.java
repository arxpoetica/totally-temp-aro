package com.altvil.aro.service.planing;

import java.io.Serializable;

import com.altvil.enumerations.OptimizationType;

@Deprecated
public class OptimizationInputs implements Serializable {
	private static final long serialVersionUID = 1L;
	public static OptimizationInputs DEFAULT = new OptimizationInputs(OptimizationType.COVERAGE, 0.5) ;
	
	public OptimizationInputs(OptimizationType optimizationType, double coverage) {
		super();
		this.optimizationType = optimizationType;
		this.coverage = coverage;
	}
	
	public OptimizationInputs() {
	}
	
	private OptimizationType optimizationType ;
	private double coverage ;
	
	public OptimizationType getOptimizationType() {
		return optimizationType;
	}
	public void setOptimizationType(OptimizationType optimizationType) {
		this.optimizationType = optimizationType;
	}
	public double getCoverage() {
		return coverage;
	}
	public void setCoverage(double coverage) {
		this.coverage = coverage;
	}

}
