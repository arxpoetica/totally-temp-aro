package com.altvil.aro.service.price.engine;

import java.util.Collection;

import com.altvil.aro.service.price.PricingModel;
import com.altvil.utils.func.Aggregator;

public interface PricingEngine {

	PriceModel createPriceModel(Collection<EquipmentCost> equipmentCosts,
			Collection<FiberCost> fiberCosts);

	PriceModelBuilder createPriceModelBuilder(PricingModel pricingModel);

	Aggregator<PriceModel> createAggregator(PricingModel pricingModel);

}
