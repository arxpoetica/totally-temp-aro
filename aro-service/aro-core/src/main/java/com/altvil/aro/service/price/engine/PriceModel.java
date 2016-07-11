package com.altvil.aro.service.price.engine;

import java.util.Collection;

public interface PriceModel {

	double getTotalCost();

	Collection<EquipmentCost> getEquipmentCosts();

	Collection<FiberCost> getFiberCosts();

}
