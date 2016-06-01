 package com.altvil.aro.service.demand.impl;

import com.altvil.aro.service.entity.LocationDemand;

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
		return DefaultLocationDemand.create(houseHold>0 ? 1: 0, business>0 ? 1 :0, cellTower > 0 ? 8 : 1) ;
	}

}
