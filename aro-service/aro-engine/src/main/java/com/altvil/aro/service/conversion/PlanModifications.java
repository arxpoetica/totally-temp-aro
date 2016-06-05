package com.altvil.aro.service.conversion;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.entity.LocationDemand;

public interface PlanModifications<T> {
	
	public PlanModifications<T> addEquipment(NetworkNode update) ;
	public PlanModifications<T> addFiber(FiberRoute update) ;
	public PlanModifications<T> setLocationDemand(LocationDemand locationDemand) ;
	
	public T commit() ;
	
}
