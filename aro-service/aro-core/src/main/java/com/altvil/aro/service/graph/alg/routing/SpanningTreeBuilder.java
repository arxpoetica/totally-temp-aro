package com.altvil.aro.service.graph.alg.routing;

import java.util.Collection;
import java.util.function.Function;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;

public interface SpanningTreeBuilder<V, E> {

	SpanningTreeBuilder<V, E> setAnalysisTransform(
			Function<WeightedGraph<V, E>, WeightedGraph<V, E>> transform);

	SpanningTreeBuilder<V, E> setGraph(WeightedGraph<V, E> graph);

	SpanningTreeBuilder<V, E> setGraphPathConstraint(GraphPathConstraint<V, E> predicate) ;
	
	SpanningTreeBuilder<V, E> setSources(Collection<V> sources);

	SpanningTreeBuilder<V, E> setTargets(Collection<V> targets);
	
	SpanningTreeBuilder<V, E> setMetricEdgeWeight(MetricEdgeWeight<E> metricEdgeWeight) ;
	
	SpanningTree<V,E> build() ;
	
	

}
