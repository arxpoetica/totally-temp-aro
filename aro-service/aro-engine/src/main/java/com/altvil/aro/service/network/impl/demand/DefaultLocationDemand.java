package com.altvil.aro.service.network.impl.demand;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public class DefaultLocationDemand implements LocationDemand {

	public static LocationDemand add(LocationDemand a, LocationDemand b) {
		Map<LocationEntityType, LocationEntityDemand> demands = new EnumMap<>(
				LocationEntityType.class);

		for (LocationEntityType t : LocationEntityType.values()) {
			demands.put(t, a.getLocationDemand(t).add(b.getLocationDemand(t)));
		}

		return new DefaultLocationDemand(demands);
	}

	/**
	 * 
	 */
	private static final long serialVersionUID = 1L;
	private Map<LocationEntityType, LocationEntityDemand> entityDemand;

	public DefaultLocationDemand(
			Map<LocationEntityType, LocationEntityDemand> entityDemand) {
		super();
		this.entityDemand = entityDemand;
	}
	

	@Override
	public double getHouseholdFiberDemandValue() {
		return getHouseholdFiberDemand().getDemand() ;
	}



	@Override
	public LocationEntityDemand getHouseholdFiberDemand() {
		return entityDemand.get(LocationEntityType.Household);
	}

	@Override
	public LocationEntityDemand getLocationDemand(LocationEntityType type) {
		return entityDemand.get(type);
	}

	@Override
	public LocationDemand add(LocationDemand coverageStatic) {
		return add(this, coverageStatic);
	}

}
