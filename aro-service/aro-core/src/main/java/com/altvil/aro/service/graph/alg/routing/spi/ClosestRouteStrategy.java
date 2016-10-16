package com.altvil.aro.service.graph.alg.routing.spi;

import com.altvil.aro.service.graph.alg.SpanningShortestPath;

public interface ClosestRouteStrategy<V, E> {

	public  SpanningShortestPath<V, E> createSpanningShortestPath(V source) ;
	
	
}