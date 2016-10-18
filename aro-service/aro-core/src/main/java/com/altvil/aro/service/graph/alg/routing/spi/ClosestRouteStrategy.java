package com.altvil.aro.service.graph.alg.routing.spi;

import com.altvil.aro.service.graph.alg.SpanningShortestPath;

public interface ClosestRouteStrategy<V, E> {

	public void reset() ;
	
	public SpanningShortestPath<V, E> createMetricSpanningShortestPath(V source);
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source);

}