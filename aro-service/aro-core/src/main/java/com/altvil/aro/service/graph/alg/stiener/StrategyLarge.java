package com.altvil.aro.service.graph.alg.stiener;

import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class StrategyLarge<V, E extends AroEdge<GeoSegment>> implements
		ClosestRouteStrategy<V, E> {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(DefaultRouteBuilder.class.getName());

	private WeightedGraph<V, E> sourceGraph;

	public StrategyLarge(WeightedGraph<V, E> sourceGraph) {
		this.sourceGraph = sourceGraph ;
	}

	@Override
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return new LowMemoryShortestSpanningPath<V, E>(sourceGraph, source);
	}

}
