package com.altvil.aro.service.entity;

public class SimpleNetworkFinancials {

	public static double costPerAtomicUnit = 199.11;
	public static double coRatio = 0.269;
	public static double fdhRatio = 0.383;
	public static double fdtRatio = 0.348;
	public static double costPerMeter = 17.32;

	private LocationDemand locationDemand;
	private double fiberLength;

	private double fiberCost;

	private double equipmentCost;

	private double coCost;
	private double fdhCost;
	private double fdtCost;
	private double totalCost;
	private double npv ;
	
	
	public SimpleNetworkFinancials(LocationDemand locationDemand,
			double fiberLength, FinancialInputs fi) {
		init(locationDemand, fiberLength, fi.getDiscountRate(), fi.getYears());
	}

	public SimpleNetworkFinancials(LocationDemand locationDemand,
			double fiberLength, double discountRate, int years) {
		init(locationDemand, fiberLength, discountRate, years);
	}

	private void init(LocationDemand locationDemand, double fiberLength, double discountRate, int years) {
		this.locationDemand = locationDemand;
		this.fiberLength = fiberLength;

		this.fiberCost = this.fiberLength * costPerMeter;
		this.equipmentCost = locationDemand.getDemand() * costPerAtomicUnit;
		this.totalCost = equipmentCost + fiberCost;

		this.coCost = equipmentCost * coRatio;
		this.fdhCost = equipmentCost * fdhRatio;
		this.fdtCost = equipmentCost * fdtRatio;
		
		this.npv = calcNpv(discountRate, years) ;
		

	}
	
	
	private double calcNpv(double discountRate, int years) {
		return (getRevenue() * calcNpvFactor(discountRate, years)) - this.getTotalCost() ;
	}
	
	private double calcNpvFactor(double discountRate, int years) {
		double npvFactor = 0;
        for (int t = 1; t <= years; t++) {
            npvFactor += 1 / Math.pow(1 + discountRate, t);
        }
        return npvFactor ;
	}

	public LocationDemand getLocationDemand() {
		return locationDemand;
	}

	public void setLocationDemand(LocationDemand locationDemand) {
		this.locationDemand = locationDemand;
	}

	public double getFiberLength() {
		return fiberLength;
	}

	public void setFiberLength(double fiberLength) {
		this.fiberLength = fiberLength;
	}

	public double getFiberCost() {
		return fiberCost;
	}

	public void setFiberCost(double fiberCost) {
		this.fiberCost = fiberCost;
	}

	public double getEquipmentCost() {
		return equipmentCost;
	}

	public void setEquipmentCost(double equipmentCost) {
		this.equipmentCost = equipmentCost;
	}

	public double getCoCost() {
		return coCost;
	}

	public void setCoCost(double coCost) {
		this.coCost = coCost;
	}

	public double getFdhCost() {
		return fdhCost;
	}

	public void setFdhCost(double fdhCost) {
		this.fdhCost = fdhCost;
	}

	public double getFdtCost() {
		return fdtCost;
	}

	public void setFdtCost(double fdtCost) {
		this.fdtCost = fdtCost;
	}

	public double getRevenue() {
		return locationDemand.getMonthlyRevenueImpact() * 12;
	}

	public double getTotalCost() {
		return totalCost;
	}

	public void setTotalCost(double totalCost) {
		this.totalCost = totalCost;
	}

	public double getNpv() {
		return npv;
	}
	
	

}
