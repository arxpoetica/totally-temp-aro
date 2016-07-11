package com.altvil.aro.service.price;

import java.util.Date;

import com.altvil.aro.service.price.engine.PriceModelBuilder;

public interface PricingService {

	PricingModel getPricingModel(String state, Date date) ;
	PriceModelBuilder createBuilder(String state, Date date) ;
	
}
