package com.altvil.aro.service.demand.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.Pair;

public class DefaultLocationDemand extends DefaultDemandStatistic implements
		LocationDemand {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public static LocationDemand ZERO_DEMAND = createHouseholdDemand(0);

	public static LocationDemand createHouseholdDemand(double houseHoldDemand) {

		Map<LocationEntityType, DemandStatistic> demands = new EnumMap<>(
				LocationEntityType.class);
		
		DemandStatistic houseHoldStat = new DefaultDemandStatistic(houseHoldDemand) ;
		
		demands.put(LocationEntityType.Household, houseHoldStat) ;
		demands.put(LocationEntityType.Business, DefaultDemandStatistic.ZERO_DEMAND) ;
		demands.put(LocationEntityType.CellTower, DefaultDemandStatistic.ZERO_DEMAND) ;
		
		return new DefaultLocationDemand(demands, houseHoldStat);
	}

	public static LocationDemand create(DemandStatistic houseHoldDemand,
			DemandStatistic businessDemand, DemandStatistic towerDemand) {
		Map<LocationEntityType, DemandStatistic> map = new EnumMap<>(
				LocationEntityType.class);
		
		map.put(LocationEntityType.Household, houseHoldDemand);
		map.put(LocationEntityType.Business, businessDemand);
		map.put(LocationEntityType.CellTower, towerDemand);

		return create(map, sum(map.values()));
	}

	public static LocationDemand create(double houseHoldDemand,
			double businessDemand, double towerDemand) {
		return create(new DefaultDemandStatistic(houseHoldDemand), new DefaultDemandStatistic(businessDemand), new DefaultDemandStatistic(towerDemand)) ;
	}

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
	private double totalFiberDemand;

	private DefaultLocationDemand(
			Map<LocationEntityType, DemandStatistic> demands,
			DemandStatistic stat) {
		super(stat.getRawCoverage(), stat.getDemand(), stat
				.getMonthlyRevenueImpact());
		this.demands = demands;
	}

	private DefaultLocationDemand(
			Map<LocationEntityType, DemandStatistic> demands, double raw,
			double demand, double revenue) {
		super(raw, demand, revenue);
		this.demands = demands;
	}

	@Override
	public DemandStatistic getLocationDemand(LocationEntityType type) {
		return demands.get(type);
	}

	@Override
	public double getTotalDemand() {
		return totalFiberDemand;
	}

	@Override
	public LocationDemand add(LocationDemand other) {

		EnumMap<LocationEntityType, DemandStatistic> result = new EnumMap<>(
				LocationEntityType.class);

		for (LocationEntityType t : LocationEntityType.values()) {

			result.put(
					t,
					DefaultDemandStatistic.sum(getLocationDemand(t),
							other.getLocationDemand(t)));
		}

		return create(result, sum(result.values()));
	}

	@Override
	public Pair<LocationDemand> splitDemand(double demand) {
		double splitDemand = Math.min(this.totalFiberDemand, demand);
		return new Pair<LocationDemand>(createHouseholdDemand(splitDemand),
				createHouseholdDemand(totalFiberDemand - splitDemand));
	}

	public double getTotalFiberDemand() {
		return totalFiberDemand;
	}	

}
