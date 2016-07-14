package com.altvil.aro.service.conversion;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.optimize.model.DemandCoverage;

public interface PlanModifications<T> {
	
	public PlanModifications<T> addEquipment(NetworkNode update) ;
	public PlanModifications<T> addFiber(FiberRoute update) ;
	public PlanModifications<T> setDemandCoverage(DemandCoverage demandCoverage) ;
	public PlanModifications<T> setEquipmentLocationMappings(Collection<EquipmentLocationMapping> mappedLocations) ;
	public PlanModifications<T> setFiberLengths(Map<FiberType, Double> map) ;
	
	public T commit() ;
	
}
