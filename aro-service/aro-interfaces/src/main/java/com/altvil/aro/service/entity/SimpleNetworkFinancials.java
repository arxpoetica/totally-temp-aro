package com.altvil.aro.service.entity;

import java.util.Arrays;

public class SimpleNetworkFinancials {
	public static double coRatio = 0.269;
	public static double costPerAtomicUnit = 199.11;
	public static double costPerMeter = 17.32;
	public static double fdhRatio = 0.383;
	public static double fdtRatio = 0.348;

	private double coCost;
	private double discountRate;
	protected double equipmentCost;
	private double fdhCost;
	private double fdtCost;
	protected double fiberCost;
	protected double fiberLength;
	protected LocationDemand locationDemand;
	private double npv;
	protected double totalCost;
	private int years;

	public SimpleNetworkFinancials(LocationDemand locationDemand, double fiberLength, double discountRate, int years) {
		this.locationDemand = locationDemand;
		this.fiberLength = fiberLength;

		this.discountRate = discountRate;
		this.years = years;
		dirty();
	}

	public SimpleNetworkFinancials(LocationDemand locationDemand, double fiberLength, FinancialInputs fi) {
		this(locationDemand, fiberLength, fi.getDiscountRate(), fi.getYears());
	}

	public double getCoCost() {
		return recalc().coCost;
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public double getEquipmentCost() {
		return recalc().equipmentCost;
	}

	public double getFdhCost() {
		return fdhCost;
	}

	public double getFdtCost() {
		return recalc().fdtCost;
	}

	public double getFiberCost() {
		return recalc().fiberCost;
	}

	public double getFiberLength() {
		return fiberLength;
	}

	public LocationDemand getLocationDemand() {
		return locationDemand;
	}

	public double getNpv() {
		return recalc().npv;
	}

	public double getRevenue() {
		return locationDemand.getMonthlyRevenueImpact() * 12;
	}

	public double getTotalCost() {
		return recalc().totalCost;
	}

	public int getYears() {
		return years;
	}

	private SimpleNetworkFinancials recalc() {
		if (Double.isNaN(npv)) {
			recalcCosts();

			coCost = equipmentCost * coRatio;
			fdhCost = equipmentCost * fdhRatio;
			fdtCost = equipmentCost * fdtRatio;

			npv = -totalCost;
			for (int t = 1; t <= years; t++) {
				npv += getRevenue() / Math.pow(1 + discountRate, t);
			}
		}
		
		return this;
	}

	protected void recalcCosts() {
		fiberCost = fiberLength * costPerMeter;

		double demand = Arrays.stream(LocationEntityType.values())
				.mapToDouble((value) -> locationDemand.getLocationDemand(value).getFairShareDemand()).sum();

		equipmentCost = demand * costPerAtomicUnit;
		totalCost = equipmentCost + fiberCost;
	}

	/**
	 * Sets flag to trigger recalculation of all derived values when one is next
	 * requested.
	 */
	private SimpleNetworkFinancials dirty() {
		npv = Double.NaN;
		return this;
	}

	public void setDiscountRate(double discountRate) {
		dirty().discountRate = discountRate;
	}

	public void setFiberLength(double fiberLength) {
		dirty().fiberLength = fiberLength;
	}

	public void setLocationDemand(LocationDemand locationDemand) {
		dirty().locationDemand = locationDemand;
	}

	public void setYears(int years) {
		dirty().years = years;
	}

}
