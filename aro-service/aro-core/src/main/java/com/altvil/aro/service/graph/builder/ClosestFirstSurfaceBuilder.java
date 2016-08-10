package com.altvil.aro.service.graph.builder;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;

public interface ClosestFirstSurfaceBuilder {
	<V,E extends AroEdge<?>> ClosestFirstSurfaceIterator<V, E> build(WeightedGraph<V, E> graph, V startVertex);
}
