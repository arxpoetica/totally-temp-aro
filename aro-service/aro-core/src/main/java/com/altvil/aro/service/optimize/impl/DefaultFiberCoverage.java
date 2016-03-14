package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Supplier;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.ZeroCoverageStatistics;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public class DefaultFiberCoverage implements DemandCoverage {

	
	public static  DemandCoverage EMPTY_COVERAGE = new DefaultFiberCoverage(ZeroCoverageStatistics.STATISTIC, new HashSet<LocationEntity>()) ;
	
	private LocationDemand coverage;
	private Set<LocationEntity> locationEntities;

	private DefaultFiberCoverage(LocationDemand coverage, Set<LocationEntity> locationEntities) {
		super();
		this.coverage = coverage;
		this.locationEntities = locationEntities;
	}

	public static Accumulator accumulate(Supplier<LocationDemand> supplier) {
		return new Accumulator(supplier);
	}

	public static DemandCoverage create(Set<LocationEntity> locationEntities,
										Supplier<LocationDemand> supplier) {

		LocationDemand coverage = supplier.get();
		locationEntities.forEach(le -> coverage.add(le.getLocationDemand()));
		return new DefaultFiberCoverage(coverage,
				locationEntities);

	}

	@Override
	public Collection<LocationEntity> getLocations() {
		return locationEntities;
	}

	@Override
	public LocationDemand getCoverage() {
		return coverage;
	}


	public static class Accumulator {

		LocationDemand coverage;
		Set<LocationEntity> locationEntities = new HashSet<>();

		public Accumulator(Supplier<LocationDemand> supplier) {
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
