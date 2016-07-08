package com.altvil.aro.service.optimize.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.demand.impl.DefaultDemandStatistic;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.Aggregator;

public class DefaultFiberCoverage implements DemandCoverage {

	public static DemandCoverage EMPTY_COVERAGE = new DefaultFiberCoverage(
			DefaultLocationDemand.ZERO_DEMAND,
			new HashSet<AssignedEntityDemand>());

	private LocationDemand coverage;
	private Set<AssignedEntityDemand> locationEntities;

	private DefaultFiberCoverage(LocationDemand coverage,
			Set<AssignedEntityDemand> locationEntities) {
		super();
		this.coverage = coverage;
		this.locationEntities = locationEntities;
	}

	@Override
	public DemandStatistic ratio(double ratio) {
		return new DefaultFiberCoverage((LocationDemand) coverage.ratio(ratio),
				locationEntities);
	}

	@Override
	public double getRequiredFiberStrands(FiberType fiberType) {
		switch (fiberType) {
		case ROOT:
		case BACKBONE:
		case FEEDER:
			// TODO KG Move constant to Config and formalize UnitOfConsumtion
			return getAtomicUnits() / 32;
		case DISTRIBUTION:
		case UNKNOWN:
			return getAtomicUnits();
		default:
			return getAtomicUnits();
		}
	}

	@Override
	public double getRawCoverage() {
		return coverage.getRawCoverage();
	}

	@Override
	public double getAtomicUnits() {
		return coverage.getAtomicUnits();
	}

	@Override
	public double getDemand() {
		return coverage.getDemand();
	}

	@Override
	public double getMonthlyRevenueImpact() {
		return coverage.getMonthlyRevenueImpact();
	}

	@Override
	public LocationDemand getLocationDemand() {
		return coverage;
	}

	public static Accumulator accumulate() {
		return new Accumulator();
	}

	@Override
	public Collection<AssignedEntityDemand> getAssignedEntityDemands() {
		return locationEntities;
	}

	@Override
	public Collection<LocationEntity> getLocations() {
		return StreamUtil.map(locationEntities,
				AssignedEntityDemand::getLocationEntity);
	}

	public static class Accumulator {

		Map<LocationEntityType, Aggregator<DemandStatistic>> demands = new EnumMap<>(
				LocationEntityType.class);

		Set<AssignedEntityDemand> locationEntities = new HashSet<>();

		public Accumulator() {
			for (LocationEntityType t : LocationEntityType.values()) {
				demands.put(t, DefaultDemandStatistic.aggregate());
			}
		}

		public void add(AssignedEntityDemand assignedEntityDemand) {
			assert !locationEntities.contains(assignedEntityDemand);

			if (!locationEntities.contains(assignedEntityDemand)) {

				for (LocationEntityType t : LocationEntityType.values()) {
					demands.get(t).add(
							assignedEntityDemand.getLocationDemand()
									.getLocationDemand(t));
				}

				locationEntities.add(assignedEntityDemand);
			} else {
				System.out.println("WTF");
			}
		}

		public void add(Collection<DemandCoverage> stats) {
			stats.forEach(this::add);
		}

		public void add(DemandCoverage dc) {
			dc.getAssignedEntityDemands().forEach(this::add);
		}

		public DemandCoverage getResult() {

			DefaultLocationDemand.Builder builder = DefaultLocationDemand
					.build();
			for (LocationEntityType type : LocationEntityType.values()) {
				DemandStatistic ds = demands.get(type);
				builder.add(type,
						ds == null ? DefaultDemandStatistic.ZERO_DEMAND : ds);
			}

			return new DefaultFiberCoverage(builder.build(), locationEntities);
		}

		public String toString() {
			return new ToStringBuilder(this).append("demands", demands)
					.toString();
		}

	}

	public String toString() {
		return new ToStringBuilder(this).append("coverage", coverage)
				.append("locationEntities", locationEntities).toString();
	}
}
