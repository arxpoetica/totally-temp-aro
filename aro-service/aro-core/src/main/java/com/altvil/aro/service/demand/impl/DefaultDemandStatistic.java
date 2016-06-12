package com.altvil.aro.service.demand.impl;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.Pair;
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
			result.demand += other.getDemand();
			result.rawCoverage += other.getRawCoverage();
			result.revenue += other.getMonthlyRevenueImpact();
		}

		@Override
		public DemandStatistic apply() {
			return result;
		}

	}

	private double rawCoverage;
	private double demand;
	private double revenue;

	public DefaultDemandStatistic(double rawCoverage, double demand,
			double revenue) {
		super();
		this.rawCoverage = rawCoverage;
		this.demand = demand;
		this.revenue = revenue;
	}

	@Override
	public DemandStatistic ratio(double ratio) {
		return new DefaultDemandStatistic(ratio * getRawCoverage(), ratio
				* getDemand(), ratio * getMonthlyRevenueImpact());
	}

	public DefaultDemandStatistic() {
		this(0, 0, 0);
	}

	@Override
	public double getRawCoverage() {
		return rawCoverage;
	}

	@Override
	public double getDemand() {
		return demand;
	}

	@Override
	public double getMonthlyRevenueImpact() {
		return revenue;
	}

	//
	//
	//

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
		private double demand = 0;
		private double revenue = 0;

		public void add(DemandStatistic value) {
			rawCoverage += value.getRawCoverage();
			demand += value.getDemand();
			revenue += value.getMonthlyRevenueImpact();
		}

		@Override
		public double getRawCoverage() {
			return rawCoverage;
		}

		@Override
		public double getDemand() {
			return demand;
		}

		@Override
		public double getMonthlyRevenueImpact() {
			return revenue;
		}

		@Override
		public DemandStatistic ratio(double ratio) {
			return new DefaultDemandStatistic(this.getRawCoverage() * ratio,
					this.getDemand() * ratio, this.getMonthlyRevenueImpact()
							* ratio);
		}

	}
}
