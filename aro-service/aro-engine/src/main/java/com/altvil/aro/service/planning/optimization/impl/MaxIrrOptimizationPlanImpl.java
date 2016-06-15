package com.altvil.aro.service.planning.optimization.impl;

import com.altvil.aro.service.planning.MaxIrrOptimizationPlan;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class MaxIrrOptimizationPlanImpl extends AbstractOptimizationPlan implements MaxIrrOptimizationPlan {
	public MaxIrrOptimizationPlanImpl(OptimizationType optimizationType) {
		super(optimizationType);
	}
	
	private double budget = Double.POSITIVE_INFINITY;
	private int years;
	
	public double getBudget() {
		return budget;
	}
	public void setBudget(double budget) {
		this.budget = budget;
	}
	public int getYears() {
		return years;
	}
	public void setYears(int years) {
		this.years = years;
	}
}
