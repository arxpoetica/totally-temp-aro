package com.altvil.aro.service.graph.alg.routing.spi;

import java.util.HashMap;
import java.util.Map;

import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint.MetricLinkDistance;
import com.altvil.aro.service.graph.alg.routing.impl.ForcedSpanningPath;
import com.altvil.aro.service.graph.alg.routing.impl.LowMemoryShortestSpanningPath;
import com.altvil.aro.service.graph.alg.routing.impl.SpanningTreeAlgorithmImpl;

public class StrategyLarge<V, E> implements ClosestRouteStrategy<V, E> {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(SpanningTreeAlgorithmImpl.class.getName());

	private WeightedGraph<V, E> metricGraph;
	private WeightedGraph<V, E> sourceGraph;

	private GraphPathConstraint<V, E> constraint;
	private MetricLinkDistance<V> metricLengthDistance;

	private Context metricContext;
	private Context analysisContext;

	public StrategyLarge(WeightedGraph<V, E> sourceGraph,
			WeightedGraph<V, E> metricGraph,
			GraphPathConstraint<V, E> constraint,
			MetricLinkDistance<V> metricLengthDistance) {

		this.metricLengthDistance = metricLengthDistance;
		this.sourceGraph = sourceGraph;
		this.metricGraph = metricGraph;

		this.constraint = constraint;

		this.metricContext = new Context(metricGraph);
		this.analysisContext = new Context(sourceGraph);
	}

	@Override
	public void reset() {
		metricContext.reset();
		analysisContext.reset();
	}

	@Override
	public boolean isParallelized() {
		return true;
	}

	@Override
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return new LowMemoryShortestSpanningPath<V, E>(analysisContext,
				sourceGraph, source);
	}

	@Override
	public SpanningShortestPath<V, E> createForcedMetricSpanningShortestPath(
			V source) {
		return new ForcedSpanningPath<>(
				metricGraph,
				source,
				new ScalarClosestFirstSurfaceIterator<V, E>(metricGraph, source),
				constraint, metricLengthDistance);
	}

	@Override
	public SpanningShortestPath<V, E> createMetricSpanningShortestPath(V source) {
		return new LowMemoryShortestSpanningPath<V, E>(metricContext,
				metricGraph, source);
	}

	private class Context implements UpdateContext<V, E> {

		private WeightedGraph<V, E> graph;
		private Map<V, ClosestFirstSurfaceIterator<V, E>> map = new HashMap<>();

		public Context(WeightedGraph<V, E> graph) {
			super();
			this.graph = graph;
		}

		public void reset() {
			map.clear();
		}

		@Override
		public ClosestFirstSurfaceIterator<V, E> getIterator(V vertex) {
			ClosestFirstSurfaceIterator<V, E> itr = map.get(vertex);
			if (itr == null) {
				map.put(vertex, itr = new ScalarClosestFirstSurfaceIterator<>(
						graph, vertex));
			}

			return itr;
		}

	}

}
