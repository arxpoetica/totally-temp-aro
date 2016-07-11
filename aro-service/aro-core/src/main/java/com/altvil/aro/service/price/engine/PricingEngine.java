package com.altvil.aro.service.price.engine;

import com.altvil.aro.service.price.PricingModel;

public interface PricingEngine {
	
	PriceModelBuilder createPriceModelBuilder(PricingModel pricingModel) ;

}
