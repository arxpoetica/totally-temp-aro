package com.altvil.aro.service.demand.impl;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityDemandByType;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.Pair;

public class DefaultLocationDemand implements LocationDemand {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	
	
	public static LocationDemand ZERO_DEMAND = createHouseholdDemand(0) ;

	public static LocationDemand createHouseholdDemand(double houseHoldDemand) {

		Map<LocationEntityType, LocationEntityDemandByType> demands = new EnumMap<>(
				LocationEntityType.class);

		for (Map.Entry<LocationEntityType, LocationEntityDemandByType> e : ZeroDemands.ZERO_DEMANDS
				.getZeroDemands().entrySet()) {
			if (e.getKey() == LocationEntityType.Household) {
				demands.put(LocationEntityType.Household,
						new DefaultLocationEntityDemand(
								LocationEntityType.Household, houseHoldDemand));
			} else {
				demands.put(e.getKey(), e.getValue());
			}
		}

		return new DefaultLocationDemand(demands, houseHoldDemand);
	}

	public static LocationDemand create(
			Map<LocationEntityType, LocationEntityDemandByType> demands,
			double totalFiberDemand) {

		return new DefaultLocationDemand(demands, totalFiberDemand);
	}

	private static double sum(
			Map<LocationEntityType, LocationEntityDemandByType> demands) {
		double total = 0;

		for (LocationEntityType t : LocationEntityType.values()) {
			total += demands.get(t).getDemand();
		}

		return total;
	}

	public static LocationDemand create(
			Map<LocationEntityType, LocationEntityDemandByType> demands) {
		return new DefaultLocationDemand(demands, sum(demands));
	}

	private Map<LocationEntityType, LocationEntityDemandByType> demands;
	private double totalFiberDemand;

	private DefaultLocationDemand(
			Map<LocationEntityType, LocationEntityDemandByType> demands,
			double totalFiberDemand) {
		super();
		this.demands = demands;
		this.totalFiberDemand = totalFiberDemand;
	}

	@Override
	public LocationEntityDemandByType getLocationDemand(LocationEntityType type) {
		return demands.get(type);
	}

	@Override
	public double getTotalDemand() {
		return totalFiberDemand;
	}

	@Override
	public LocationDemand add(LocationDemand other) {
		EnumMap<LocationEntityType, LocationEntityDemandByType> result = new EnumMap<>(
				LocationEntityType.class);

		double total = 0;
		for (LocationEntityType t : LocationEntityType.values()) {
			LocationEntityDemandByType led = getLocationDemand(t).add(
					other.getLocationDemand(t));
			total += led.getDemand();
			result.put(t, led);
		}

		return create(result, total);
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

	private static class ZeroDemands {

		public static ZeroDemands ZERO_DEMANDS = new ZeroDemands();

		private Map<LocationEntityType, LocationEntityDemandByType> emptyDemands = new EnumMap<LocationEntityType, LocationEntityDemandByType>(
				LocationEntityType.class);

		private ZeroDemands() {
			for (LocationEntityType t : LocationEntityType.values()) {
				emptyDemands.put(t, new DefaultLocationEntityDemand(t, 0));
			}
		}

		public Map<LocationEntityType, LocationEntityDemandByType> getZeroDemands() {
			return emptyDemands;
		}

	}

}
