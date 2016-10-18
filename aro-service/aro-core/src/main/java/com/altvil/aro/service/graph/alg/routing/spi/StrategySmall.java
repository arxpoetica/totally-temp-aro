package com.altvil.aro.service.graph.alg.routing.spi;

import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.alg.routing.impl.DefaultShortestSpanningPath;

public class StrategySmall<V, E> implements ClosestRouteStrategy<V, E> {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(StrategySmall.class.getName());

	private WeightedGraph<V, E> graph;
	private WeightedGraph<V, E> metricGraph;

	public StrategySmall(WeightedGraph<V, E> graph,
			WeightedGraph<V, E> metricGraph) {
		super();
		this.graph = graph;
		this.metricGraph = metricGraph;
	}
	
	@Override
	public void reset() {
	}


	@Override
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source) {

		return new DefaultShortestSpanningPath<V, E>(graph, source,
				new ScalarClosestFirstSurfaceIterator<V, E>(graph, source));
	}

	@Override
	public SpanningShortestPath<V, E> createMetricSpanningShortestPath(V source) {
		return new DefaultShortestSpanningPath<V, E>(
				metricGraph,
				source,
				new ScalarClosestFirstSurfaceIterator<V, E>(metricGraph, source));
	}

}
