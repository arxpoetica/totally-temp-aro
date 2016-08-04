package com.altvil.aro.service.price.engine;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.interfaces.CableConstructionEnum;

public interface PriceModelBuilder {

	PriceModelBuilder add(EquipmentCost equipmentCost);

	PriceModelBuilder add(FiberCost equipmentCost);

	PriceModelBuilder add(MaterialType type, double quantity, double atomicUnits);

	PriceModelBuilder add(NetworkNodeType type, double quantity,
			double atomicUnits);

	PriceModelBuilder add(FiberType type,
			CableConstructionEnum cableConstruction, double lengthInMeteres);

	PriceModel build();

}
