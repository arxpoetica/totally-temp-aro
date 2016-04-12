package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.entity.FiberType;

public interface FiberStrandConverter {
	
	int getFiberStrandCount(FiberType type, double fiberDemand) ;

}
