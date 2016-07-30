package com.altvil.aro.service.graph;

import com.altvil.aro.service.graph.model.EdgeData;
import com.altvil.aro.service.graph.model.NetworkData;

public interface GraphNetworkModelService {
	
	GraphNetworkModelBuilder build() ;
	GraphNetworkModelBuilder build(EdgeData edgeData) ;
	GraphNetworkModelBuilder build(NetworkData networkData) ;


}
