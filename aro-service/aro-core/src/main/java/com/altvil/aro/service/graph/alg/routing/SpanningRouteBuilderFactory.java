package com.altvil.aro.service.graph.alg.routing;

import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.routing.impl.SpanningTreeAlgorithmImpl;
import com.altvil.aro.service.graph.alg.routing.spi.ClosestRouteStrategy;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningTreeAlgorithm;
import com.altvil.aro.service.graph.alg.routing.spi.StrategyLarge;
import com.altvil.aro.service.graph.alg.routing.spi.StrategySmall;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class SpanningRouteBuilderFactory {

	public static final SpanningRouteBuilderFactory FACTORY = new SpanningRouteBuilderFactory();

	private static int largeStrategyThreshold = 1000;

	public <V, E extends AroEdge<GeoSegment>> SpanningTreeAlgorithm<V, E> create(
			WeightedGraph<V, E> sourceGraph, Collection<V> sources,
			Collection<V> targets) {
		return create(sourceGraph, (md, gp) -> true, sources, targets);
	}
	
	

	public <V, E extends AroEdge<GeoSegment>> SpanningTreeAlgorithm<V, E> create(
			WeightedGraph<V, E> sourceGraph,
			GraphPathConstraint<V, E> pathPredicate, Collection<V> sources,
			Collection<V> targets) {

		ClosestRouteStrategy<V, E> closestRouteStrategy = (targets.size() <= largeStrategyThreshold) ? new StrategySmall<V, E>(
				sourceGraph, ScalarClosestFirstSurfaceIterator.BUILDER)
				: new StrategyLarge<V, E>(sourceGraph);

		return new SpanningTreeAlgorithmImpl<V, E>(closestRouteStrategy, sourceGraph,
				pathPredicate, sources, targets);
	}

	public <V, E extends AroEdge<GeoSegment>> SpanningTreeAlgorithm<V, E> create(
			ClosestFirstSurfaceBuilder builder,
			WeightedGraph<V, E> sourceGraph,
			GraphPathConstraint<V, E> pathPredicate, Collection<V> sources,
			Collection<V> targets) {
		return new SpanningTreeAlgorithmImpl<V, E>(new StrategySmall<V, E>(
				sourceGraph, builder), sourceGraph, pathPredicate, sources,
				targets);
	}

}
