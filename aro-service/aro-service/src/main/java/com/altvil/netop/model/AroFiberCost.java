package com.altvil.netop.model;

import com.altvil.interfaces.FiberCableConstructionType;

public class AroFiberCost {
	private String fiberType;
	private String constructionType;
	private String costCode;
	double costPerMeter;

	private double lengthMeters;
	private double totalCost;

	public AroFiberCost(FiberCableConstructionType fct,
			double costPerMeter, double lengthMeters, double totalCost) {
		super();
		this.fiberType = fct.getFiberType().getCode();
		this.constructionType = fct.getCableConstructionEnum().getCode() ;
		this.costCode = fct.getCode();
		this.costPerMeter = costPerMeter;
		this.lengthMeters = lengthMeters;
		this.totalCost = totalCost;
	}

	public String getFiberType() {
		return fiberType;
	}
	
	public String getConstructionType() {
		return constructionType;
	}

	public String getCostCode() {
		return costCode;
	}

	public double getCostPerMeter() {
		return costPerMeter;
	}

	public double getLengthMeters() {
		return lengthMeters;
	}

	public double getTotalCost() {
		return totalCost;
	}

}
