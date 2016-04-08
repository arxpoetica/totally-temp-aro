package com.altvil.aro.service.network.impl;

import com.altvil.aro.service.demand.impl.DefaultLocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityDemandByType;
import com.altvil.aro.service.entity.LocationEntityType;

public class ZeroLocationEntityDemand extends DefaultLocationEntityDemand {

	public ZeroLocationEntityDemand(LocationEntityType type) {
		super(type, 0.0);
	}

	@Override
	public LocationEntityDemandByType add(LocationEntityDemandByType other) {
		return other ;
	}

}
