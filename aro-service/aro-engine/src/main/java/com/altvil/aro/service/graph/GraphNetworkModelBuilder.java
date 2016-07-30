package com.altvil.aro.service.graph;

import com.altvil.aro.service.construction.CableConstructionPricing;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.builder.CoreGraphNetworkModelService.GraphBuilderContext;

public interface GraphNetworkModelBuilder {
	
	GraphNetworkModelBuilder setCableConstructionPricing(CableConstructionPricing pricing) ;
	GraphNetworkModel build() ;
	GraphBuilderContext createContext() ;
	

}
