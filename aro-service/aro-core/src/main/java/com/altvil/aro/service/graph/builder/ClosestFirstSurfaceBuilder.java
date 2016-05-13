package com.altvil.aro.service.graph.builder;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;

public interface ClosestFirstSurfaceBuilder<V,E> {
	ClosestFirstSurfaceIterator<V, E> build(WeightedGraph<V, E> graph, V startVertex);
}
