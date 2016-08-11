package com.altvil.netop.model;

public class AroEquipmentCost {
	private String nodeType;
	private String costCode;
	private double price;

	private double quantity;
	private double total;
	private double atomicUnits;

	public AroEquipmentCost(String nodeType, String costCode, double price,
			double quantity, double total, double atomicUnits) {
		super();
		this.nodeType = nodeType;
		this.costCode = costCode;
		this.price = price;
		this.quantity = quantity;
		this.total = total;
		this.atomicUnits = atomicUnits;
	}

	public String getNodeType() {
		return nodeType;
	}

	public String getCostCode() {
		return costCode;
	}

	public double getPrice() {
		return price;
	}

	public double getQuantity() {
		return quantity;
	}

	public double getTotal() {
		return total;
	}

	public double getAtomicUnits() {
		return atomicUnits;
	}
}
