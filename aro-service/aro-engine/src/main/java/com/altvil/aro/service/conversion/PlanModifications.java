package com.altvil.aro.service.conversion;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;

public interface PlanModifications<T> {
	
	public PlanModifications<T> addEquipment(NetworkNode update) ;
	public PlanModifications<T> addFiber(FiberRoute update) ;
	public PlanModifications<T> addAtomicCount(int count) ;
	
	public T commit() ;
	
}
