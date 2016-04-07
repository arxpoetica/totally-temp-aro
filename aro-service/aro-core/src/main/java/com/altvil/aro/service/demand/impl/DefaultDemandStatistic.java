package com.altvil.aro.service.demand.impl;

import com.altvil.aro.service.entity.DemandStatistic;

public class DefaultDemandStatistic implements DemandStatistic {

	public static DemandStatistic ZERO_DEMAND = new DefaultDemandStatistic(0) ;
	
	//TODO KG extract to  config
	public static double arpu = 60.0 ;
	
	private double rawCoverage ;
	private double demand ;
	private double revenue ;
	
	public DefaultDemandStatistic(double rawCoverage, double demand,
			double revenue) {
		super();
		this.rawCoverage = rawCoverage;
		this.demand = demand;
		this.revenue = revenue;
	}
	
	public DefaultDemandStatistic(double rawCoverage) {
		this(rawCoverage, rawCoverage, rawCoverage * arpu) ;
	}

	@Override
	public double getRawCoverage() {
		return rawCoverage ;
	}

	@Override
	public double getDemand() {
		return demand ;
	}

	@Override
	public double getMonthlyRevenueImpact() {
		return revenue ;
	}
	
	//
	//
	//
	
	public static DemandStatistic sum(Iterable<DemandStatistic> stats) {
		DemandSummer demandSummer = new DemandSummer() ;
		for(DemandStatistic s : stats) {
			demandSummer.add(s) ;
		}
		return demandSummer ;
	}
	
	public static DemandStatistic sum(DemandStatistic ... stats) {
		DemandSummer demandSummer = new DemandSummer() ;
		for(DemandStatistic s : stats) {
			demandSummer.add(s) ;
		}
		return demandSummer ;
	}
	
	public static class DemandSummer implements DemandStatistic {
		private double rawCoverage = 0;
		private double demand = 0;
		private double revenue = 0 ;

		public void add(DemandStatistic value) {
			rawCoverage += value.getRawCoverage();
			demand += value.getDemand() ;
			revenue += value.getMonthlyRevenueImpact() ;
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
			return revenue ;
		}
	}
}
