package com.altvil.aro.service.graph.alg.routing;

import java.util.Collection;
import java.util.function.Function;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface SpanningTreeBuilder<V, E extends AroEdge<GeoSegment>> {

	SpanningTreeBuilder<V, E> setAnalysisTransform(
			Function<WeightedGraph<V, E>, WeightedGraph<V, E>> transform);

	SpanningTreeBuilder<V, E> setGraph(WeightedGraph<V, E> graph);

	SpanningTreeBuilder<V, E> setGraphPathConstraint(GraphPathConstraint<V, E> predicate) ;
	
	SpanningTreeBuilder<V, E> setSources(Collection<V> sources);

	SpanningTreeBuilder<V, E> setTargets(Collection<V> targets);
	
	SpanningTree<V,E> build() ;
	
	

}
