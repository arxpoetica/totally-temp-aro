package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.model.EdgeData;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.CableConstruction;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.interfaces.CableConduitEdge;

public interface CoreGraphNetworkModelService {

	public interface GraphBuilderContext {
		RatioSection convert(CableConduitEdge edge);
		CableConstruction getDefaultCableConstruction();
	}

	GraphNetworkModel createGraphNetworkModel(EdgeData edgeData,
			GraphBuilderContext ctx);

	GraphNetworkModel createGraphNetworkModel(NetworkData networkData,
			GraphBuilderContext ctx);

}
