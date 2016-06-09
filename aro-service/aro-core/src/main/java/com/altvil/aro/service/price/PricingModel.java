package com.altvil.aro.service.price;

import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;

public interface PricingModel {
	
	double  getPrice(DropCable dropCable) ;

	double getMaterialCost(MaterialType type);

	double getFiberCostPerMeter(FiberType fiberType, int requiredFiberStrands);

}
