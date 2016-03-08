package com.altvil.aro.service.entity;

public class ZeroCoverageStatistics implements CoverageAggregateStatistic {

	public static CoverageAggregateStatistic STATISTIC = new ZeroCoverageStatistics();

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	@Override
	public double getFiberDemand() {
		return 0;
	}

	@Override
	public CoverageAggregateStatistic add(
			CoverageAggregateStatistic coverageStatic) {
		return coverageStatic ;
	}

}
