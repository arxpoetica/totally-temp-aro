package com.altvil.aro.service.entity;


public interface AssignedEntityDemand  {

	double getAtomicUnits() ;
	
	public abstract LocationDemand getLocationDemand();
	public abstract LocationEntity getLocationEntity();

}