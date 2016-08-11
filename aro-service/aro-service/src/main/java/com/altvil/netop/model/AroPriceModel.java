package com.altvil.netop.model;

import java.util.Collection;

public class AroPriceModel {

	private double totalCost;
	private Collection<AroEquipmentCost> equipmentCosts;
	private Collection<AroFiberCost> fiberCosts;

	public AroPriceModel(double totalCost,
			Collection<AroEquipmentCost> equipmentCosts,
			Collection<AroFiberCost> fiberCosts) {
		super();
		this.totalCost = totalCost;
		this.equipmentCosts = equipmentCosts;
		this.fiberCosts = fiberCosts;
	}

	public double getTotalCost() {
		return totalCost;
	}

	public Collection<AroEquipmentCost> getEquipmentCosts() {
		return equipmentCosts;
	}

	public Collection<AroFiberCost> getFiberCosts() {
		return fiberCosts;
	}


}
