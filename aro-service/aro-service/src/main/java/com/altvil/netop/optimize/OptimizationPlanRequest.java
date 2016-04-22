package com.altvil.netop.optimize;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planing.OptimizationInputs;

public class OptimizationPlanRequest {
	private long planId;
	private FiberNetworkConstraints fiberNetworkConstraints;
	private OptimizationInputs optimizationInputs = OptimizationInputs.DEFAULT ;
	private String algorithm ;

	public long getPlanId() {
		return planId;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public void setFiberNetworkConstraints(
			FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

	public String getAlgorithm() {
		return algorithm;
	}

	public void setAlgorithm(String algorithm) {
		this.algorithm = algorithm;
	}

	public OptimizationInputs getOptimizationInputs() {
		return optimizationInputs;
	}

	public void setOptimizationInputs(OptimizationInputs optimizationInputs) {
		this.optimizationInputs = optimizationInputs;
	}
	
	
	
	

}
