 package com.altvil.aro.service.network.impl.demand;

import java.util.EnumMap;
import java.util.Map;

import com.altvil.aro.service.demand.DefaultLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public class LocationDemandFactory {
	
	public static final LocationDemandFactory FACTORY = new LocationDemandFactory() ;
	
	private LocationDemand defaultDemand ;
	private LocationDemand zeroDemand ;
	
	private LocationDemandFactory() {
		defaultDemand = create(1.0, 0.0, 0.0) ;
		zeroDemand = create(0,0,0) ;
	}
	
	public LocationDemand getDefaultDemand() {
		return defaultDemand ;
	}
	
	public LocationDemand getZeroDemand() {
		return zeroDemand ;
	}
	
	public LocationDemand create(double houseHold, double business, double cellTower) {
		Map<LocationEntityType, LocationEntityDemand> demands = new EnumMap<>(LocationEntityType.class) ;
		demands.put(LocationEntityType.Household, LocationEntityDemandFactory.FACTORY.create(LocationEntityType.Household, houseHold)) ;
		demands.put(LocationEntityType.Business, LocationEntityDemandFactory.FACTORY.create(LocationEntityType.Business, business)) ;
		demands.put(LocationEntityType.CellTower, LocationEntityDemandFactory.FACTORY.create(LocationEntityType.CellTower, cellTower)) ;
		
		return DefaultLocationDemand.create(demands) ;
		
	}

}
