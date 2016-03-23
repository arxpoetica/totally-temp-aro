package com.altvil.aro.service.network.impl.demand;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.impl.ZeroLocationEntityDemand;

public class LocationEntityDemandFactory {

	public static final LocationEntityDemandFactory FACTORY = new LocationEntityDemandFactory() ;
	
	private Map<LocationEntityType, LocationEntityDemand> zeroDemand = new EnumMap<>(LocationEntityType.class) ;
	
	private LocationEntityDemandFactory() {
		for(LocationEntityType t : LocationEntityType.values()) {
			zeroDemand.put(t, new ZeroLocationEntityDemand(t)) ;
		}
	}

	public LocationEntityDemand create(LocationEntityType type, double demand) {
		return demand == 0.0 ? zeroDemand.get(type)
				: new DefaultLocationEntityDemand(type, demand);
	}

}
