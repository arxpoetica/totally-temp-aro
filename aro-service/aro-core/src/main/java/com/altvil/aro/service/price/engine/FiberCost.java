package com.altvil.aro.service.price.engine;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.utils.func.Aggregator;

public class FiberCost {

	public static FiberCostAggregator aggregate(FiberType fiberType) {
		return new FiberCostAggregator(fiberType);
	}

	public static FiberCost createFiberCost(FiberType fiberType,
			double costPerMeter, double lengthMeters, double totalCost) {
		return new FiberCost(fiberType, costPerMeter, lengthMeters, totalCost);
	}

	public static class FiberCostAggregator implements Aggregator<FiberCost> {
		
		private FiberCost fiberCost;

		public FiberCostAggregator(FiberType fiberType) {
			fiberCost = new FiberCost(fiberType, 0.0);
		}

		public void add(double length, double cost) {
			fiberCost.lengthMeters += length;
			fiberCost.totalCost += cost ;
		}

		@Override
		public void add(FiberCost val) {
			fiberCost.lengthMeters += val.getLengthMeters();
			fiberCost.totalCost += val.getTotalCost();
		}

		@Override
		public FiberCost apply() {
			if( fiberCost.getLengthMeters() > 0 ) {
				fiberCost.costPerMeter = fiberCost.totalCost / fiberCost.lengthMeters ;
			}
			return fiberCost;
		}

	}

	private FiberType fiberType;
	private double costPerMeter;

	private double lengthMeters;
	private double totalCost;

	private FiberCost(FiberType fiberType, double costPerMeter) {
		super();
		this.fiberType = fiberType;
		this.costPerMeter = costPerMeter;
	}

	private FiberCost(FiberType fiberType, double costPerMeter,
			double lengthMeters, double totalCost) {
		super();
		this.fiberType = fiberType;
		this.costPerMeter = costPerMeter;
		this.lengthMeters = lengthMeters;
		this.totalCost = totalCost;
	}

	public FiberType getFiberType() {
		return fiberType;
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
