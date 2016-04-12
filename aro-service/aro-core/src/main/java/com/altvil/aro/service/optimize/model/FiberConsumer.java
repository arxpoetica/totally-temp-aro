package com.altvil.aro.service.optimize.model;

import java.util.Set;

import com.altvil.aro.service.entity.FiberType;

public interface FiberConsumer {
	
	Set<FiberType> getFiberTypes() ;
	double getCount(FiberType fiberType) ;

}
