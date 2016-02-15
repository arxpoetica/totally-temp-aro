package com.altvil.aro.service.optimize;

import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.aro.service.graph.segment.FiberType;

public interface PricingModel {
	
	double  getPrice(DropCable dropCable) ;

	double getMaterialCost(MaterialType type);

	double getFiberCostPerMeter(FiberType fiberType, int requiredFiberStrands);

}
