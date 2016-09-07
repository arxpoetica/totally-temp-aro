package com.altvil.aro.service.graph;

import com.altvil.aro.service.graph.segment.GeoSegment;

public class EdgeUtils {
	
	public static double getLength(AroEdge<GeoSegment> edge) {
		return edge.getValue().getLength() ;
	}
	
}
