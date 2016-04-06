package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
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

	public static Accumulator accumulate() {
		return new Accumulator();
	}

	public static DemandCoverage create(Set<LocationEntity> locationEntities) {

		Accumulator accumlator = new Accumulator();
		locationEntities.forEach(accumlator::add);
		return accumlator.getResult() ;

	}

	@Override
	public Collection<LocationEntity> getLocations() {
		return locationEntities;
	}

	@Override
	public LocationDemand getCoverage() {
		return coverage;
	}

	private static class DoubleSummer {
		private double sum = 0;

		public void add(double val) {
			sum += val;
		}

		public double getResult() {
			return sum;
		}
	}

	public static class Accumulator {

		Map<LocationEntityType, DoubleSummer> demands = new EnumMap<>(
				LocationEntityType.class);

		Set<LocationEntity> locationEntities = new HashSet<>();

		public Accumulator() {
			for (LocationEntityType t : LocationEntityType.values()) {
				demands.put(t, new DoubleSummer());
			}
		}
		
		public void add(LocationEntity location) {

			for (LocationEntityType t : LocationEntityType.values()) {
				demands.get(t).add(
						location.getLocationDemand().getLocationDemand(t)
								.getDemand());
			}

			locationEntities.add(location);
		}

		

		public void add(Collection<LocationEntity> locations,
				LocationDemand locationDemand) {
			for (LocationEntityType t : LocationEntityType.values()) {
				demands.get(t).add(
						locationDemand.getLocationDemand(t).getDemand());
			}
			locationEntities.addAll(locations);
		}

		public void add(DemandCoverage fc) {
			add(fc.getLocations(), fc.getCoverage());
		}

		public DemandCoverage getResult() {
			return new DefaultFiberCoverage(DefaultLocationDemand.create(
					demands.get(LocationEntityType.Household).getResult(),
					demands.get(LocationEntityType.Business).getResult(),
					demands.get(LocationEntityType.CellTower).getResult()),
					locationEntities);
		}

	}

}
