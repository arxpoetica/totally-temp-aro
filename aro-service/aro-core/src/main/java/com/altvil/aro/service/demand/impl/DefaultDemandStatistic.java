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
			result.atomicUnits += other.getAtomicUnits();
			result.rawCoverage += other.getRawCoverage();
			result.totalRevenue += other.getTotalRevenue();
			result.revenue += other.getMonthlyRevenueImpact();

			result.penetration = result.totalRevenue == 0 ? 0 : result.revenue
					/ result.totalRevenue;

		}

		@Override
		public DemandStatistic apply() {
			return result;
		}

	}

	private double rawCoverage;
	private double atomicUnits;
	private double totalRevenue;
	private double revenue;

	private double penetration;

	public DefaultDemandStatistic(double rawCoverage, double atomicUnits,
			double totalRevenue, double revenue, double penetration) {
		super();
		this.rawCoverage = rawCoverage;
		this.atomicUnits = atomicUnits;
		this.totalRevenue = totalRevenue;
		this.revenue = revenue;

		this.penetration = penetration;
		
		if( penetration > 1.0 ) {
			throw new RuntimeException("Invalid Penetration") ;
		}
		
		if( totalRevenue < 0 || revenue < 0) {
			throw new RuntimeException("Inavlid revenue") ;
		}

	}

	public DefaultDemandStatistic() {
		this(0, 0, 0, 0, 0);
	}

	@Override
	public double getRawCoverage() {
		return rawCoverage;
	}

	@Override
	public double getFairShareDemand() {
		return penetration * rawCoverage;
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
	public double getTotalRevenue() {
		return totalRevenue;
	}

	@Override
	public double getPenetration() {
		return penetration;
	}

	public static DemandStatistic sum(Iterable<DemandStatistic> stats) {
		
		Aggregator<DemandStatistic> aggregator = aggregate() ;
		stats.forEach(aggregator::add);
		return aggregator.apply() ;
	
	}

	public static DemandStatistic sum(DemandStatistic... stats) {
		Aggregator<DemandStatistic> aggregator = aggregate() ;
		for (DemandStatistic s : stats) {
			aggregator.add(s);
		}
		return aggregator.apply();
	}


	public String toString() {
		return new ToStringBuilder(this).append("demand", getFairShareDemand())
				.append("rawCoverage", rawCoverage).append("revenue", revenue)
				.toString();
	}
}
