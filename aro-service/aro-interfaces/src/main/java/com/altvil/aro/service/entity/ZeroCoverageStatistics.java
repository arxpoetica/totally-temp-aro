package com.altvil.aro.service.entity;


public class ZeroCoverageStatistics implements CoverageAggregateStatistic {

	public static CoverageAggregateStatistic STATISTIC = new ZeroCoverageStatistics() ;
	
	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	

	@Override
	public void add(CoverageAggregateStatistic other) {
		throw new RuntimeException("Operation Not Supported") ;
	}

	@Override
	public double getMonthlyCashFlowImpact() {
		return 0;
	}

	@Override
	public double getDemandCoverage() {
		return 0;
	}

	@Override
	public double getFiberDemand() {
		return 0;
	}

	@Override
	public double getScore(double capex) {
		return 0;
	}
	
	

}
