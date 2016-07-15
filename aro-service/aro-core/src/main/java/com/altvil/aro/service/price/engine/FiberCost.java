package com.altvil.aro.service.price.engine;

import com.altvil.aro.service.entity.FiberType;
import com.altvil.utils.func.Aggregator;

public class FiberCost {

	public static FiberCostAggregator aggregate(FiberType fiberType,
			double costPerMeter) {
		return new FiberCostAggregator(fiberType, costPerMeter);
	}

	public static class FiberCostAggregator implements Aggregator<FiberCost> {

		private FiberCost fiberCost;

		public FiberCostAggregator(FiberType fiberType, double costPerMeter) {
			fiberCost = new FiberCost(fiberType, costPerMeter);
		}

		public void add(double length) {
			fiberCost.lengthMeters += length;
			fiberCost.totalCost += (length * fiberCost.costPerMeter) ;
		}

		@Override
		public void add(FiberCost val) {
			fiberCost.lengthMeters += val.getLengthMeters();
			fiberCost.totalCost += val.getTotalCost();
		}

		@Override
		public FiberCost apply() {
			fiberCost.totalCost = fiberCost.totalCost * fiberCost.costPerMeter;
			return fiberCost;
		}

	}

	private FiberType fiberType;
	double costPerMeter;

	private double lengthMeters;
	private double totalCost;

	private FiberCost(FiberType fiberType, double costPerMeter) {
		super();
		this.fiberType = fiberType;
		this.costPerMeter = costPerMeter;
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
