package com.altvil.aro.service.price.engine;

import com.altvil.aro.service.price.PricingModel;
import com.altvil.utils.func.Aggregator;

public interface PricingEngine {
	
	PriceModelBuilder createPriceModelBuilder(PricingModel pricingModel) ;
	Aggregator<PriceModel> createAggregator(PricingModel pricingModel) ;

}
