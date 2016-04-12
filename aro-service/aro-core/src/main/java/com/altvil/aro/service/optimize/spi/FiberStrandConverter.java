package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.entity.FiberType;

public interface FiberStrandConverter {
	
	double convertFiberCount(FiberType sourece, FiberType target, double fiberDemand) ;

}
