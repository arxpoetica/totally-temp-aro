package com.altvil.aro.service.price.engine;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;

public interface PriceModelBuilder {

	PriceModelBuilder add(MaterialType type, double quantity, double atomicUnits);
	PriceModelBuilder add(NetworkNodeType type, double quantity, double atomicUnits);
	PriceModelBuilder add(FiberType type, double lengthInMeteres) ;
	
	PriceModel build() ;

}
