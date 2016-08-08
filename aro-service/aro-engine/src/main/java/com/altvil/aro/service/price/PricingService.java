package com.altvil.aro.service.price;

import java.util.Date;

import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.price.engine.PriceModelBuilder;
import com.altvil.utils.func.Aggregator;

public interface PricingService {
	
	PricingModel getPricingModel(String state, Date date, PricingContext ctx) ;
	PriceModelBuilder createBuilder(String state, Date date, PricingContext ctx) ;
	Aggregator<PriceModel> aggregate() ;
	
}
