package com.altvil.aro.service.price.engine;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.entity.MaterialType;
import com.altvil.interfaces.FiberCableConstructionType;

public interface PriceModelBuilder {

	PriceModelBuilder add(EquipmentCost equipmentCost);

	PriceModelBuilder add(FiberCost equipmentCost);

	PriceModelBuilder add(MaterialType type, double quantity, double atomicUnits);

	PriceModelBuilder add(NetworkNodeType type, double quantity,
			double atomicUnits);

	PriceModelBuilder add(FiberCableConstructionType ftc, double lengthInMeteres);

	PriceModel build();

}
