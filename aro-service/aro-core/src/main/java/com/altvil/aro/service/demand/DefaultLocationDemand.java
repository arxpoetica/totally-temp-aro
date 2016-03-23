package com.altvil.aro.service.demand;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.ZeroCoverageStatistics;

public class DefaultLocationDemand implements LocationDemand {

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;

	
	public static LocationDemand createHouseholdDemand(
			double houseHoldDemand) {

		Map<LocationEntityType, LocationEntityDemand> demands = new EnumMap<>(LocationEntityType.class) ;
		for(LocationEntityType t : LocationEntityType.values()) {
			LocationEntityDemand led = ZeroCoverageStatistics.STATISTIC.getLocationDemand(t) ;
			if( led.getEntityType() == LocationEntityType.Household) {
				led = led.add(houseHoldDemand) ;
			}
			demands.put(t, led) ;
		}
		
		return new DefaultLocationDemand(demands, houseHoldDemand);
	}
	
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
	
	@Override
	public Collection<LocationDemand> splitDemand(int maxDemand) {
		double totalDemand = getTotalDemand() ;
		
		List<LocationDemand> result = new ArrayList<>() ;
		
		while(totalDemand > maxDemand ) {
			result.add(createHouseholdDemand(maxDemand)) ;
			totalDemand -= maxDemand ;
		}
		
		if( totalDemand > 0 ) {
			result.add(createHouseholdDemand(maxDemand)) ;
		}
		
		return result ;
	}

	public double getTotalFiberDemand() {
		return totalFiberDemand;
	}
	
	

}
