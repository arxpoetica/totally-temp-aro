package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public class DefaultFiberCoverage implements DemandCoverage {

	public static DemandCoverage EMPTY_COVERAGE = new DefaultFiberCoverage(
			DefaultLocationDemand.ZERO_DEMAND, new HashSet<LocationEntity>());

	
	private LocationDemand coverage;
	private Set<LocationEntity> locationEntities;

	private DefaultFiberCoverage(LocationDemand coverage,
			Set<LocationEntity> locationEntities) {
		super();
		this.coverage = coverage;
		this.locationEntities = locationEntities;
	}

	@Override
	public double getRawCoverage() {
		return coverage.getRawCoverage() ;
	}

	@Override
	public double getDemand() {
		return coverage.getDemand() ;
	}

	@Override
	public double getMonthlyRevenueImpact() {
		return coverage.getMonthlyRevenueImpact() ;
	}

	@Override
	public LocationDemand getLocationDemand() {
		return coverage ;
	}

	public static Accumulator accumulate() {
		return new Accumulator();
	}
	

	@Override
	public Collection<LocationEntity> getLocations() {
		return locationEntities;
	}

	

	private static class DemandSummer implements DemandStatistic {
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
	
	


	public static class Accumulator {

		Map<LocationEntityType, DemandSummer> demands = new EnumMap<>(
				LocationEntityType.class);

		Set<LocationEntity> locationEntities = new HashSet<>();

		public Accumulator() {
			for (LocationEntityType t : LocationEntityType.values()) {
				demands.put(t, new DemandSummer());
			}
		}
		
		public void add(LocationEntity location, LocationDemand locationDemand) {

			for (LocationEntityType t : LocationEntityType.values()) {
				demands.get(t).add(
						locationDemand.getLocationDemand(t));
			}

			locationEntities.add(location);
		}

		private void add(LocationDemand locationDemand) {
			for (LocationEntityType t : LocationEntityType.values()) {
				demands.get(t).add(
						locationDemand.getLocationDemand(t));
			}
		}
		
		public void add(Collection<DemandCoverage> stats) {
			stats.forEach(this::add) ;
		}

		public void addLocations(LocationEntity le, LocationDemand demand) {
			for (LocationEntityType t : LocationEntityType.values()) {
				demands.get(t).add(
						demand.getLocationDemand(t));
			}
			locationEntities.add(le);
		}

		public void add(DemandCoverage dc) {
			add(dc.getLocationDemand()) ;
			locationEntities.addAll(dc.getLocations()) ;
		}

		public DemandCoverage getResult() {
			return new DefaultFiberCoverage(DefaultLocationDemand.create(
					demands.get(LocationEntityType.Household),
					demands.get(LocationEntityType.Business),
					demands.get(LocationEntityType.CellTower)),
					locationEntities);
		}

	}

}
