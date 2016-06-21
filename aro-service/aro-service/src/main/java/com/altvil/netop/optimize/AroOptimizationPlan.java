package com.altvil.netop.optimize;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.OptimizationType;

public class AroOptimizationPlan {
	
	private long planId;

	private OptimizationType optimizationType;
	
	private FinancialConstraints financialConstraints;
	private FiberNetworkConstraints fiberNetworkConstraints;
	
	private Double coverage ;
	private Double threshold;

	public long getPlanId() {
		return planId;
	}
	public void setPlanId(long planId) {
		this.planId = planId;
	}
	public OptimizationType getOptimizationType() {
		return optimizationType;
	}
	public void setOptimizationType(OptimizationType optimizationType) {
		this.optimizationType = optimizationType;
	}
	public FinancialConstraints getFinancialConstraints() {
		return financialConstraints;
	}
	public void setFinancialConstraints(FinancialConstraints financialConstraints) {
		this.financialConstraints = financialConstraints;
	}
	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}
	public void setFiberNetworkConstraints(
			FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}
	public Double getCoverage() {
		return coverage;
	}
	public void setCoverage(Double coverage) {
		this.coverage = coverage;
	}
	
	public Double getThreshold() {
		return threshold;
	}
	
	public void setThreshold(Double threshold) {
		this.threshold = threshold;
	}
}
