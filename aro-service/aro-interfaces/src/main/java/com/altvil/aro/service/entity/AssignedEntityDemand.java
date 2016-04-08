package com.altvil.aro.service.entity;


public interface AssignedEntityDemand extends DemandStatistic {

	public abstract LocationDemand getLocationDemand();

	public abstract LocationEntity getLocationEntity();

}