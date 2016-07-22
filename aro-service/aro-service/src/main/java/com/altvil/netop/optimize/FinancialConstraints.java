package com.altvil.netop.optimize;

public class FinancialConstraints {

	private double budget = Double.POSITIVE_INFINITY;
	private double discountRate = 0.06 ;
	private int years = 15;
	
	
	public double getBudget() {
		return budget;
	}
	public void setBudget(double budget) {
		this.budget = budget;
	}
	public double getDiscountRate() {
		return discountRate;
	}
	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}
	public int getYears() {
		return years;
	}
	public void setYears(int years) {
		this.years = years;
	}

	
	
	
}
