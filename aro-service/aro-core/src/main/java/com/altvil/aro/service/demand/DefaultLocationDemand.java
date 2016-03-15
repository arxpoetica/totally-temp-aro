package com.altvil.aro.service.demand;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public class DefaultLocationDemand implements LocationDemand {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	public static LocationDemand create(
			Map<LocationEntityType, LocationEntityDemand> demands,
			double totalFiberDemand) {

		return new DefaultLocationDemand(demands, totalFiberDemand);
	}

	private static double sum(
			Map<LocationEntityType, LocationEntityDemand> demands) {
		double total = 0;

		for (LocationEntityType t : LocationEntityType.values()) {
			total += demands.get(t).getDemand();
		}

		return total;
	}

	public static LocationDemand create(
			Map<LocationEntityType, LocationEntityDemand> demands) {
		return new DefaultLocationDemand(demands, sum(demands));
	}

	private Map<LocationEntityType, LocationEntityDemand> demands;
	private double totalFiberDemand;

	private DefaultLocationDemand(
			Map<LocationEntityType, LocationEntityDemand> demands,
			double totalFiberDemand) {
		super();
		this.demands = demands;
		this.totalFiberDemand = totalFiberDemand;
	}

	@Override
	public LocationEntityDemand getLocationDemand(LocationEntityType type) {
		return demands.get(type);
	}

	@Override
	public double getTotalDemand() {
		return totalFiberDemand;
	}

	@Override
	public LocationDemand add(LocationDemand other) {
		EnumMap<LocationEntityType, LocationEntityDemand> result = new EnumMap<>(
				LocationEntityType.class);

		double total = 0;
		for (LocationEntityType t : LocationEntityType.values()) {
			LocationEntityDemand led = getLocationDemand(t).add(
					other.getLocationDemand(t));
			total += led.getDemand();
			result.put(t, led);
		}

		return create(result, total);
	}

	public double getTotalFiberDemand() {
		return totalFiberDemand;
	}
	

}
