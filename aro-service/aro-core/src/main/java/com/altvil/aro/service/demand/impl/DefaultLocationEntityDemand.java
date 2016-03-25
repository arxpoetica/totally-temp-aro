package com.altvil.aro.service.demand.impl;

import com.altvil.aro.service.entity.LocationEntityDemandByType;
import com.altvil.aro.service.entity.LocationEntityType;

public class DefaultLocationEntityDemand implements LocationEntityDemandByType {

	
	
	public static LocationEntityDemandByType create(LocationEntityType type, double demand) {
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
	public LocationEntityDemandByType add(LocationEntityDemandByType other) {
		return add(other.getDemand()) ;
	}

	@Override
	public LocationEntityDemandByType add(double other) {
		return new DefaultLocationEntityDemand(type, other + demand) ;
	}
	
	

}
