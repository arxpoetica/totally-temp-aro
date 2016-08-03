package com.altvil.aro.service.graph;

import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.price.PricingModel;

public interface GraphNetworkModelBuilder {
	
	GraphNetworkModelBuilder setPricingModel(PricingModel pricingModel) ;
	GraphNetworkModel build() ;
	GraphBuilderContext createContext() ;
	

}
