package com.altvil.aro.service.price;

import com.altvil.aro.service.entity.DropCable;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.interfaces.CableConstructionEnum;

public interface PricingModel {
	
	double  getPrice(DropCable dropCable) ;

	double getMaterialCost(MaterialType type);
	
	double getMaterialCost(MaterialType type, double atomicUnits);
	
	double getFiberCostPerMeter(FiberType fiberType, CableConstructionEnum constructionType, int requiredFiberStrands);

}
