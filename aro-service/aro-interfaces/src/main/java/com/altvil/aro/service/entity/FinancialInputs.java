package com.altvil.aro.service.entity;

public class FinancialInputs {

	public static final FinancialInputs DEFAULT = new FinancialInputs(0.03, 10) ;
	
	private double discountRate;
	private int years;

	public FinancialInputs(double discountRate, int years) {
		this.discountRate = discountRate;
		this.years = years;
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getYears() {
		return years;
	}

}
