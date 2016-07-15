package com.altvil.aro.service.price.engine;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.utils.func.Aggregator;

public class EquipmentCost {

	public static EquipmentAggregator aggregator(NetworkNodeType nodeType) {
		return aggregator(nodeType, 0);
	}

	public static EquipmentCost createEquipmentCost(NetworkNodeType nodeType,
			double price, double quantity, double total, double atomicUnits) {
		return new EquipmentCost(nodeType, price, quantity, total, atomicUnits);
	}

	public static EquipmentAggregator aggregator(NetworkNodeType nodeType,
			double price) {
		return new EquipmentAggregator(nodeType, price);
	}

	public static class EquipmentAggregator implements
			Aggregator<EquipmentCost> {

		private EquipmentCost equipmentCost;

		public EquipmentAggregator(NetworkNodeType nodeType, double price) {
			equipmentCost = new EquipmentCost(nodeType, price);
		}

		public void add(double atomicUnits, double quantity, double total) {
			equipmentCost.atomicUnits += atomicUnits;
			equipmentCost.quantity += quantity;
			equipmentCost.total += total;
		}

		@Override
		public void add(EquipmentCost val) {
			equipmentCost.atomicUnits += val.getAtomicUnits();
			equipmentCost.quantity += val.getQuantity();
			equipmentCost.total += val.getTotal();
		}

		@Override
		public EquipmentCost apply() {
			return equipmentCost;
		}

	}

	private NetworkNodeType nodeType;
	private double price;

	private double quantity;
	private double total;
	private double atomicUnits;

	private EquipmentCost(NetworkNodeType nodeType, double price) {
		super();
		this.nodeType = nodeType;
		this.price = price;
	}

	private EquipmentCost(NetworkNodeType nodeType, double price,
			double quantity, double total, double atomicUnits) {
		super();
		this.nodeType = nodeType;
		this.price = price;
		this.quantity = quantity;
		this.total = total;
		this.atomicUnits = atomicUnits;
	}

	public NetworkNodeType getNodeType() {
		return nodeType;
	}

	public double getQuantity() {
		return quantity;
	}

	public double getPrice() {
		return price;
	}

	public double getTotal() {
		return total;
	}

	public double getAtomicUnits() {
		return atomicUnits;
	}

}
