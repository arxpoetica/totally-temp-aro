package com.altvil.aro.service.graph.transform.network;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.splitter.EdgeWeightFunction;

public interface GraphRenoderService {
	
	GraphRenoder createGraphRenoder(GraphModel<GeoSegment> graph, boolean normalize) ;
	
	GraphRenoder createGraphRenoder(GraphModel<GeoSegment> graph,
			boolean normalize, EdgeWeightFunction weightingFunction) ;

}
