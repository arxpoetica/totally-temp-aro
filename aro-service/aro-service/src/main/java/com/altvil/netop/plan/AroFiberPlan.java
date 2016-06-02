package com.altvil.netop.plan;

import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.enumerations.FiberPlanAlgorithm;
import com.altvil.netop.optimize.FinancialConstraints;

public class AroFiberPlan {
	
	private long planId;

	private FiberPlanAlgorithm algorithm;
	
	private FinancialConstraints financialConstraints = new FinancialConstraints();
	private FiberNetworkConstraints fiberNetworkConstraints;
	
	public long getPlanId() {
		return planId;
	}
	public void setPlanId(long planId) {
		this.planId = planId;
	}
	public FiberPlanAlgorithm getAlgorithm() {
		return algorithm;
	}
	public void setAlgorithm(FiberPlanAlgorithm algorithm) {
		this.algorithm = algorithm;
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
}
