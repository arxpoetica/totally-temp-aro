package com.altvil.aro.service.conversion;

import java.util.Map;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.LocationDemand;

public interface PlanModifications<T> {
	
	public PlanModifications<T> addEquipment(NetworkNode update) ;
	public PlanModifications<T> addFiber(FiberRoute update) ;
	public PlanModifications<T> setLocationDemand(LocationDemand locationDemand) ;
	public PlanModifications<T> setFiberLengths(Map<FiberType, Double> map) ;
	
	public T commit() ;
	
}
