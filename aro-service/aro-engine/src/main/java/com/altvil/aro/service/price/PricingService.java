package com.altvil.aro.service.price;

import java.util.Date;

import com.altvil.aro.service.price.engine.PriceModel;
import com.altvil.aro.service.price.engine.PriceModelBuilder;
import com.altvil.utils.func.Aggregator;

public interface PricingService {

	PricingModel getPricingModel(String state, Date date) ;
	PriceModelBuilder createBuilder(String state, Date date) ;
	Aggregator<PriceModel> aggregate() ;
	
}
