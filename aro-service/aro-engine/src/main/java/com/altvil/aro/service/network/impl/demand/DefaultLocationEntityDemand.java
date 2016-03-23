package com.altvil.aro.service.network.impl.demand;

import com.altvil.aro.service.entity.LocationEntityDemand;
import com.altvil.aro.service.entity.LocationEntityType;

public class DefaultLocationEntityDemand implements LocationEntityDemand {

	
	
	public static LocationEntityDemand create(LocationEntityType type, double demand) {
		return new DefaultLocationEntityDemand(type, demand) ;
	}
	
	private LocationEntityType type ;
	private double demand ;
	
	public DefaultLocationEntityDemand(LocationEntityType type, double demand) {
		super();
		this.type = type;
		this.demand = demand;
	}

	@Override
	public LocationEntityType getEntityType() {
		return type ;
	}

	@Override
	public double getDemand() {
		return demand ;
	}

	@Override
	public LocationEntityDemand add(LocationEntityDemand other) {
		return add(other.getDemand()) ;
	}

	@Override
	public LocationEntityDemand add(double other) {
		return new DefaultLocationEntityDemand(type, other + demand) ;
	}
	
	

}
