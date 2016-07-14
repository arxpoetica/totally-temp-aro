package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.optimization.OptimizedPlan;

public class MasterOptimizationAnalysis {

	private MasterOptimizationPlan plan ;
	
	public MasterOptimizationAnalysis(MasterOptimizationPlan plan) {
		super();
		this.plan = plan;
	}


	public MasterOptimizationPlan getPlan() {
		return plan;
	}
	
	
	public Collection<OptimizedPlan> getWirecenters() {
		return plan.getUpdates();
	}
	
	
	
}
