package com.altvil.aro.service.price.engine;

import com.altvil.interfaces.FiberCableConstructionType;
import com.altvil.utils.func.Aggregator;

public class FiberCost {

	public static FiberCostAggregator aggregate(FiberCableConstructionType fct) {
		return new FiberCostAggregator(fct);
	}

	public static FiberCost createFiberCost(FiberCableConstructionType fct,
			double costPerMeter, double lengthMeters, double totalCost) {
		return new FiberCost(fct, costPerMeter, lengthMeters, totalCost);
	}

	public static class FiberCostAggregator implements Aggregator<FiberCost> {
		
		private FiberCost fiberCost;

		public FiberCostAggregator(FiberCableConstructionType fct) {
			fiberCost = new FiberCost(fct, 0.0);
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

	private FiberCableConstructionType fiberConstructionType ;
	
	private double costPerMeter;

	private double lengthMeters;
	private double totalCost;
	
	private FiberCost(FiberCableConstructionType fiberConstructionType,
			double costPerMeter, double lengthMeters, double totalCost) {
		
		this.fiberConstructionType = fiberConstructionType;
		this.costPerMeter = costPerMeter ;
		this.lengthMeters = lengthMeters;
		this.totalCost = totalCost;
	}
	
	private FiberCost(FiberCableConstructionType fiberConstructionType, double costPerMeter) {
		super();
		this.fiberConstructionType = fiberConstructionType;
		this.costPerMeter = costPerMeter;
	}

	private FiberCost(FiberCableConstructionType fiberConstructionType,
			double lengthMeters, double totalCost) {
		super();
		this.fiberConstructionType = fiberConstructionType;
		this.lengthMeters = lengthMeters;
		this.totalCost = totalCost;
	}

	
	
	
	public FiberCableConstructionType getFiberConstructionType() {
		return fiberConstructionType;
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
