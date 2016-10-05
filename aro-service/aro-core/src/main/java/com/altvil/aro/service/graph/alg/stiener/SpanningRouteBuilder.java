package com.altvil.aro.service.graph.alg.stiener;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.segment.GeoSegment;


public interface SpanningRouteBuilder<V, E extends AroEdge<GeoSegment>> {

	public Collection<SourceRoute<V, E>> build() ;
	
//	public Collection<SourceRoute<V, E>> build(WeightedGraph<V, E> source,
//			Collection<V> all_roots, Collection<V> targets);
//
//	public Collection<SourceRoute<V, E>> build(
//			GraphPathConstraint<V, E> pathPredicate,
//			WeightedGraph<V, E> sourceGraph, Collection<V> all_roots,
//			Collection<V> targets);
//
//	public SourceRoute<V, E> buildSourceRoute(
//			GraphPathConstraint<V, E> pathPredicate,
//			WeightedGraph<V, E> source, V root, Collection<V> targets);

}