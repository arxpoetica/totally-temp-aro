package com.altvil.netop.optimize;

import com.altvil.aro.service.optimization.wirecenter.FinancialConstraints;

public class FinancialConstraintsImpl implements FinancialConstraints {

	private double budget = Double.POSITIVE_INFINITY;
	private double discountRate = 0.06 ;
	private int years = 15;
	
	
	@Override
	public double getBudget() {
		return budget;
	}
	public void setBudget(double budget) {
		this.budget = budget;
	}
	@Override
	public double getDiscountRate() {
		return discountRate;
	}
	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}
	@Override
	public int getYears() {
		return years;
	}
	public void setYears(int years) {
		this.years = years;
	}

	
	
	
}
