package com.altvil.aro.service.graph.alg;

import org.jgrapht.Graph;
import org.jgrapht.traverse.ClosestFirstIterator;
import org.jgrapht.util.FibonacciHeapNode;

public class ScalarClosestFirstSurfaceIterator<V, E> extends ClosestFirstIterator<V, E> implements ClosestFirstSurfaceIterator<V, E> {
	public ScalarClosestFirstSurfaceIterator(Graph<V, E> g, V startVertex, double radius) {
		super(g, startVertex, radius);
	}

	public ScalarClosestFirstSurfaceIterator(Graph<V, E> g, V startVertex) {
		super(g, startVertex);
	}

	public ScalarClosestFirstSurfaceIterator(Graph<V, E> g) {
		super(g);
	}

	@Override
	public void logWeight(V vertex) {
		double d = getShortestPathLength(vertex);
		
		System.err.println("|" + vertex + "," + d);
		
	}
}
