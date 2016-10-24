package com.altvil.aro.service.optimization.constraints;

import com.altvil.enumerations.OptimizationType;

public class AbstractOptimizationConstraint implements OptimizationConstraints {

	private OptimizationType optimizationType ;
	private int years ;
	private double discountRate ;
	private boolean forced;


	public AbstractOptimizationConstraint(OptimizationType optimizationType,
										  int years, double discountRate, boolean forced) {
		super();
		this.optimizationType = optimizationType;
		this.years = years;
		this.discountRate = discountRate;
		this.forced = forced;
	}

	@Override
	public OptimizationType getOptimizationType() {
		return optimizationType ;
	}

	@Override
	public int getYears() {
		return years ;
	}

	@Override
	public double getDiscountRate() {
		return discountRate;
	}

	@Override
	public boolean isForced() {
		return forced;
	}

}
