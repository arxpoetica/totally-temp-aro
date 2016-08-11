package com.altvil.aro.service.graph.transform.network;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GraphRenoderService {
	
	GraphRenoder createGraphRenoder(GraphModel<GeoSegment> graph, boolean normalize) ;


}
