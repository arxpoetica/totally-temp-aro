package com.altvil.aro.service.demand.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.Pair;
import com.altvil.utils.func.Aggregator;

public class DefaultLocationDemand extends DefaultDemandStatistic implements
		LocationDemand {

	public static LocationDemand ZERO_DEMAND = new DefaultLocationDemand();

	/**
	 * 
	 */

	public static Aggregator<LocationDemand> demandAggregate() {
		return new DemandAggregator();
	}

	private static class DemandAggregator implements Aggregator<LocationDemand> {

		private Map<LocationEntityType, Aggregator<DemandStatistic>> demandMap = new EnumMap<>(
				LocationEntityType.class);

		private DemandAggregator() {
			for (LocationEntityType t : LocationEntityType.values()) {
				demandMap.put(t, DefaultDemandStatistic.aggregate());
			}
		}

		@Override
		public void add(LocationDemand val) {
			for (LocationEntityType t : LocationEntityType.values()) {
				demandMap.get(t).add(val.getLocationDemand(t));
			}
		}

		@Override
		public LocationDemand apply() {
			Map<LocationEntityType, DemandStatistic> map = new EnumMap<>(
					LocationEntityType.class);
			demandMap.entrySet().stream().forEach(e -> {
				map.put(e.getKey(), e.getValue().apply());
			});
			return create(map, sum(map.values()));
		}

	}

	public static Builder build() {
		return new Builder();
	}

	public static class Builder {

		Map<LocationEntityType, DemandStatistic> demands = new EnumMap<>(
				LocationEntityType.class);

		

		public Builder add(LocationEntityType type,
				DemandStatistic demandStatistic) {
			demands.put(type, demandStatistic);
			return this;
		}

		public LocationDemand build() {
			return DefaultLocationDemand.create(demands);
		}
	}

	private static final long serialVersionUID = 1L;

	public static LocationDemand create(
			Map<LocationEntityType, DemandStatistic> demands,
			DemandStatistic totalFiberDemand) {
		return new DefaultLocationDemand(demands, totalFiberDemand);
	}

	private static DemandStatistic sum(
			Map<LocationEntityType, DemandStatistic> demands) {
		return DefaultDemandStatistic.sum(demands.values());
	}

	public static LocationDemand create(
			Map<LocationEntityType, DemandStatistic> demands) {
		return new DefaultLocationDemand(demands, sum(demands));
	}

	private Map<LocationEntityType, DemandStatistic> demands;

	private DefaultLocationDemand() {
		super(0, 0, 0, 0);
		Map<LocationEntityType, DemandStatistic> map = new EnumMap<>(
				LocationEntityType.class);
		for (LocationEntityType t : LocationEntityType.values()) {
			map.put(t, DefaultDemandStatistic.ZERO_DEMAND);
		}

	}

	private DefaultLocationDemand(
			Map<LocationEntityType, DemandStatistic> demands,
			DemandStatistic stat) {
		super(stat.getRawCoverage(), stat.getAtomicUnits(), stat.getFairShareDemand(), stat
				.getMonthlyRevenueImpact());
		this.demands = demands;
	}

	private DefaultLocationDemand(
			Map<LocationEntityType, DemandStatistic> demands, double raw,
			double atomicUnits, double demand,  double revenue) {
		super(raw, atomicUnits, demand, revenue);
		this.demands = demands;
	}

	@Override
	public DemandStatistic getLocationDemand(LocationEntityType type) {
		return demands.get(type);
	}

	private static Pair<DemandStatistic> split(DemandStatistic ds, double atomicUnitRemainder) {

		if (atomicUnitRemainder == ds.getAtomicUnits()) {
			return new Pair<>(ds, DefaultDemandStatistic.ZERO_DEMAND);
		}

		atomicUnitRemainder = Math.min(atomicUnitRemainder, ds.getAtomicUnits());

		double ratio = atomicUnitRemainder / ds.getAtomicUnits();
		double tailRatio = Math.max(0.0, 1 - ratio);

		double headAtomicUnits = atomicUnitRemainder;
		double tailAtomicUnits = ds.getAtomicUnits() - atomicUnitRemainder;

		return new Pair<>(new DefaultDemandStatistic(ds.getRawCoverage()
				* ratio, headAtomicUnits, ds.getFairShareDemand() * ratio, ds.getMonthlyRevenueImpact() * ratio),
				new DefaultDemandStatistic(ds.getRawCoverage() * tailRatio,
						tailAtomicUnits, ds.getFairShareDemand() * tailRatio, ds.getMonthlyRevenueImpact() * tailRatio));

	}

	private Pair<LocationDemand> splitDemand(double demand,
			LocationEntityType[] types) {

		Map<LocationEntityType, DemandStatistic> head = new EnumMap<>(
				LocationEntityType.class);
		Map<LocationEntityType, DemandStatistic> tail = new EnumMap<>(
				LocationEntityType.class);

		double remainingDemand = demand;
		for (LocationEntityType lt : types) {
			DemandStatistic ds = getLocationDemand(lt);
			if (Math.abs(remainingDemand - 0) < 0.00001 || ds.getAtomicUnits() == 0) {
				head.put(lt, DefaultDemandStatistic.ZERO_DEMAND);
				tail.put(lt, ds);
			} else {

				Pair<DemandStatistic> pair = split(ds, remainingDemand);

				head.put(lt, pair.getHead());
				tail.put(lt, pair.getTail());

				remainingDemand -= pair.getHead().getFairShareDemand();
			}
		}

		return new Pair<LocationDemand>(create(head, sum(head)), create(tail,
				sum(tail)));
	}

	private static final LocationEntityType[] reduceTypes = new LocationEntityType[] {
			LocationEntityType.Household, LocationEntityType.SmallBusiness,
			LocationEntityType.MediumBusiness,
			LocationEntityType.LargeBusiness, LocationEntityType.CellTower };
	
	
	@Override
	public Pair<LocationDemand> splitDemand(double demand) {
		return splitDemand(Math.min(getFairShareDemand(), demand), reduceTypes);
	}

}
