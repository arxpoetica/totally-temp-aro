package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Supplier;

import com.altvil.aro.service.entity.CoverageAggregateStatistic;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.ZeroCoverageStatistics;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public class DefaultFiberCoverage implements DemandCoverage {

	
	public static  DemandCoverage EMPTY_COVERAGE = new DefaultFiberCoverage(ZeroCoverageStatistics.STATISTIC, new HashSet<LocationEntity>()) ;
	
	private CoverageAggregateStatistic coverage;
	private Set<LocationEntity> locationEntities;

	private DefaultFiberCoverage(CoverageAggregateStatistic coverage, Set<LocationEntity> locationEntities) {
		super();
		this.coverage = coverage;
		this.locationEntities = locationEntities;
	}

	public static Accumulator accumulate(Supplier<CoverageAggregateStatistic> supplier) {
		return new Accumulator(supplier);
	}

	public static DemandCoverage create(Set<LocationEntity> locationEntities,
										Supplier<CoverageAggregateStatistic> supplier) {

		CoverageAggregateStatistic coverage = supplier.get();
		locationEntities.forEach(le -> coverage.add(le.getCoverageStatistics()));
		return new DefaultFiberCoverage(coverage,
				locationEntities);

	}

	@Override
	public Collection<LocationEntity> getLocations() {
		return locationEntities;
	}

	@Override
	public CoverageAggregateStatistic getCoverage() {
		return coverage;
	}


	public static class Accumulator {

		CoverageAggregateStatistic coverage;
		Set<LocationEntity> locationEntities = new HashSet<>();

		public Accumulator(Supplier<CoverageAggregateStatistic> supplier) {
			coverage = supplier.get();
		}

		public void add(DemandCoverage fc) {
			coverage.add(fc.getCoverage());
			locationEntities.addAll(fc.getLocations());
		}

		public DemandCoverage getResult() {
			return new DefaultFiberCoverage(coverage,
					locationEntities);
		}

	}


}
