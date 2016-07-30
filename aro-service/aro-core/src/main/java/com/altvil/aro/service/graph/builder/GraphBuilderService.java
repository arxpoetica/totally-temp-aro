package com.altvil.aro.service.graph.builder;

import java.util.function.Function;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.interfaces.CableConduitEdge;

public interface GraphBuilderService {
	
	GraphNetworkModel createGraphNetworkModel(NetworkData networkData,
			Function<CableConduitEdge, RatioSection> fToRatioSection);

}
