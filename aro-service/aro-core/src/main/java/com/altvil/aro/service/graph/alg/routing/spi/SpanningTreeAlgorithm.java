package com.altvil.aro.service.graph.alg.routing.spi;

import java.util.Collection;

import com.altvil.aro.service.graph.alg.SourceRoute;


public interface SpanningTreeAlgorithm<V, E> {

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