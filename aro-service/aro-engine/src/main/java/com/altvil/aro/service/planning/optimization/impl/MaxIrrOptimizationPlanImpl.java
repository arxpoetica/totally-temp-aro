package com.altvil.aro.service.planning.optimization.impl;


import com.altvil.aro.service.planning.IrrOptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public class MaxIrrOptimizationPlanImpl extends AbstractOptimizationPlan implements IrrOptimizationPlan {
	private double budget = Double.POSITIVE_INFINITY;
	private double irr;
	private int	   years;
	
	public MaxIrrOptimizationPlanImpl(OptimizationType optimizationType) {
		super(optimizationType);
	}

	public double getBudget() {
		return budget;
	}

	public double getIrr() {
		return irr;
	}

	public int getYears() {
		return years;
	}

	public void setBudget(double budget) {
		this.budget = budget;
	}

	public void setIrr(double irr) {
		this.irr = irr;
	}

	public void setYears(int years) {
		this.years = years;
	}
}
