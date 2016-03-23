package com.altvil.aro.service.network.impl;

import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.network.impl.demand.DefaultLocationEntityDemand;

public class ZeroLocationEntityDemand extends DefaultLocationEntityDemand {

	public ZeroLocationEntityDemand(LocationEntityType type) {
		super(type, 0.0);
	}

	@Override
	public LocationEntityDemand add(LocationEntityDemand other) {
		return other ;
	}

}
