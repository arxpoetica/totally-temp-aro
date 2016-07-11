package com.altvil.aro.service.demand.impl;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.utils.func.Aggregator;

public class DefaultDemandStatistic implements DemandStatistic {

	public static DemandStatistic ZERO_DEMAND = new DefaultDemandStatistic();

	public static Aggregator<DemandStatistic> aggregate() {
		return new DemandAggregator();
	}

	public static class DemandAggregator implements Aggregator<DemandStatistic> {

		private DefaultDemandStatistic result = new DefaultDemandStatistic();

		@Override
		public void add(DemandStatistic other) {
			result.demand += other.getFairShareDemand();
			result.atomicUnits += other.getAtomicUnits();
			result.rawCoverage += other.getRawCoverage();
			result.revenue += other.getMonthlyRevenueImpact();
		}

		@Override
		public DemandStatistic apply() {
			return result;
		}

	}

	private double rawCoverage;
	private double atomicUnits;
	private double demand;
	private double revenue;

	public DefaultDemandStatistic(double rawCoverage, double atomicUnits,
			double demand, double revenue) {
		super();
		this.rawCoverage = rawCoverage;
		this.atomicUnits = atomicUnits;
		this.demand = demand;
		this.revenue = revenue;
	}

	// @Override
	// public DemandStatistic ratio(double ratio) {
	// return new DefaultDemandStatistic(ratio * getRawCoverage(),
	// ratio * atomicUnits, ratio
	// * getDemand(), ratio * getMonthlyRevenueImpact());
	// }

	public DefaultDemandStatistic() {
		this(0, 0, 0, 0);
	}

	@Override
	public double getRawCoverage() {
		return rawCoverage;
	}

	@Override
	public double getFairShareDemand() {
		return demand;
	}

	@Override
	public double getAtomicUnits() {
		return atomicUnits;
	}

	@Override
	public double getMonthlyRevenueImpact() {
		return revenue;
	}
	
	//
	//
	//

	@Override
	public double getPenetration() {
		return rawCoverage == 0 ? 0 : demand /rawCoverage ;
	}

	public static DemandStatistic sum(Iterable<DemandStatistic> stats) {
		DemandSummer demandSummer = new DemandSummer();
		for (DemandStatistic s : stats) {
			demandSummer.add(s);
		}
		return demandSummer;
	}

	public static DemandStatistic sum(DemandStatistic... stats) {
		DemandSummer demandSummer = new DemandSummer();
		for (DemandStatistic s : stats) {
			demandSummer.add(s);
		}
		return demandSummer;
	}

	public static class DemandSummer implements DemandStatistic {
		private double rawCoverage = 0;
		private double atomicUnits = 0;
		private double demand = 0;
		private double revenue = 0;

		public void add(DemandStatistic value) {
			rawCoverage += value.getRawCoverage();
			atomicUnits += value.getAtomicUnits();
			demand += value.getFairShareDemand();
			revenue += value.getMonthlyRevenueImpact();
		}

		@Override
		public double getAtomicUnits() {
			return atomicUnits;
		}

		@Override
		public double getRawCoverage() {
			return rawCoverage;
		}

		@Override
		public double getFairShareDemand() {
			return demand;
		}

		@Override
		public double getMonthlyRevenueImpact() {
			return revenue;
		}

		@Override
		public double getPenetration() {
			return rawCoverage == 0 ? 0 : demand / rawCoverage;
		}

		// @Override
		// public DemandStatistic ratio(double ratio) {
		// return new DefaultDemandStatistic(this.getRawCoverage() * ratio,
		// ratio * atomicUnits,
		// this.getDemand() * ratio, this.getMonthlyRevenueImpact()
		// * ratio);
		// }

	}

	public String toString() {
		return new ToStringBuilder(this).append("demand", demand)
				.append("rawCoverage", rawCoverage).append("revenue", revenue)
				.toString();
	}
}
