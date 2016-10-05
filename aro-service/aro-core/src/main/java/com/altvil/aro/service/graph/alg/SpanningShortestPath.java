package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;

public interface SpanningShortestPath<V, E extends AroEdge<?>> {

	public V findClosestTarget(Collection<V> targets);

	public GraphPath<V, E> getGraphPath(V endVertex);

	public double getWeight(V vertex);

}