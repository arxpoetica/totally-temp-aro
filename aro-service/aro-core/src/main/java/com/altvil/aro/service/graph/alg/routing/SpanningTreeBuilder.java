package com.altvil.aro.service.graph.alg.routing;

import java.util.Collection;

import com.altvil.aro.service.graph.alg.routing.impl.SourceGraph;
import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;

public interface SpanningTreeBuilder<V, E> {

	SpanningTreeBuilder<V, E> setSourceGraph(SourceGraph<V,E> sourceGraph) ;
	
	SpanningTreeBuilder<V, E> setGraphPathConstraint(GraphPathConstraint<V, E> predicate) ;
	SpanningTreeBuilder<V, E> setMetricEdgeWeight(MetricEdgeWeight<E> metricEdgeWeight) ;
	
	SpanningTreeBuilder<V, E> setTargets(Collection<V> targets);
	SpanningTreeBuilder<V, E> setSources(Collection<V> sources);
	
	SpanningTree<V,E> build() ;
	
	

}
