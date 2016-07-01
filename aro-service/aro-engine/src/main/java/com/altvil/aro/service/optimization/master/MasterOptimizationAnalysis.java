package com.altvil.aro.service.optimization.master;

import java.util.Collection;

import com.altvil.aro.service.planing.WirecenterNetworkPlan;

public class MasterOptimizationAnalysis {

	private MasterOptimizationPlan plan ;
	
	public MasterOptimizationAnalysis(MasterOptimizationPlan plan) {
		super();
		this.plan = plan;
	}


	public MasterOptimizationPlan getPlan() {
		return plan;
	}
	
	
	public Collection<WirecenterNetworkPlan> getWirecenters() {
		return plan.getUpdates();
	}
	
	
	
}
