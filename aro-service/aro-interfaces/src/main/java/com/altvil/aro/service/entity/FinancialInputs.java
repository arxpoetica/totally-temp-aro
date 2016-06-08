package com.altvil.aro.service.entity;

public class FinancialInputs {

	public static final FinancialInputs DEFAULT = new FinancialInputs(0.03, 10, 1.0) ;
	
	private double discountRate;
	private int years;
	private double p;

	public FinancialInputs(double discountRate, int years, double p) {
		super();
		this.discountRate = discountRate;
		this.years = years;
		this.p = p;
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getYears() {
		return years;
	}

	public double getP() {
		return p;
	}

}
