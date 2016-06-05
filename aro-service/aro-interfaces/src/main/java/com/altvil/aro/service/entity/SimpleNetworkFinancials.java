package com.altvil.aro.service.entity;

public class SimpleNetworkFinancials {

	public static double costPerAtomicUnit = 76.50;
	public static double coRatio = 0.262;
	public static double fdhRatio = 0.346;
	public static double fdtRatio = 0.392;
	public static double costPerMeter = 17.32;

	private LocationDemand locationDemand;
	private double fiberLength;

	private double fiberCost;

	private double equipmentCost;

	private double coCost;
	private double fdhCost;
	private double fdtCost;
	private double totalCost;

	public SimpleNetworkFinancials(LocationDemand locationDemand,
			double fiberLength) {
		init(locationDemand, fiberLength);
	}

	private void init(LocationDemand locationDemand, double fiberLength) {
		this.locationDemand = locationDemand;
		this.fiberLength = fiberLength;

		this.fiberCost = this.fiberLength * costPerMeter;
		this.equipmentCost = locationDemand.getDemand() * costPerAtomicUnit;
		this.totalCost = equipmentCost + fiberCost;

		this.coCost = equipmentCost * coRatio;
		this.fdhCost = equipmentCost * fdhRatio;
		this.fdtCost = equipmentCost * fdtRatio;

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

	public double getTotalCost() {
		return totalCost;
	}

	public void setTotalCost(double totalCost) {
		this.totalCost = totalCost;
	}

}
