package com.altvil.aro.service.optimize.spi;

import com.altvil.aro.service.graph.transform.ftp.HubModel;
import com.altvil.aro.service.price.PricingModel;

public interface PricingContext {
	
	HubModel getHubModel();
	
	PricingModel getPricingModel();
	

}
