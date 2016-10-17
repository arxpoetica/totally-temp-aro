package com.altvil.aro.service.graph.alg.routing.spi;

import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.alg.routing.impl.DefaultShortestSpanningPath;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;

public class StrategySmall<V, E> implements ClosestRouteStrategy<V, E> {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(StrategySmall.class.getName());

	private WeightedGraph<V, E> graph;

	public StrategySmall(WeightedGraph<V, E> graph,
			ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder) {
		super();
		this.graph = graph;
	}

	@Override
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source) {

		return new DefaultShortestSpanningPath<V, E>(
				graph,
				source,
				new ScalarClosestFirstSurfaceIterator<V, E>(graph, source));
	}

}
