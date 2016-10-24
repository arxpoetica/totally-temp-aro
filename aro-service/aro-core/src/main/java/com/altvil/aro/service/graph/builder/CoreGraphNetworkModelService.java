package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.model.EdgeData;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignmentModel;

public interface CoreGraphNetworkModelService {

	public interface GraphBuilderContext {
		RatioSection convert(CableConduitEdge edge);
		CableConstructionEnum getDefaultCableConstruction();
	}

	GraphNetworkModel createGraphNetworkModel(EdgeData edgeData,
			GraphBuilderContext ctx);

	GraphNetworkModel createGraphNetworkModel(NetworkData networkData,
											  GraphBuilderContext ctx);

}
