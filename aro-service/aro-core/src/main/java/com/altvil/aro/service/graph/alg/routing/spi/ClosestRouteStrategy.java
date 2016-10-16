package com.altvil.aro.service.graph.alg.routing.spi;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface ClosestRouteStrategy<V, E extends AroEdge<GeoSegment>> {

	public  SpanningShortestPath<V, E> createSpanningShortestPath(V source) ;
	
	
}