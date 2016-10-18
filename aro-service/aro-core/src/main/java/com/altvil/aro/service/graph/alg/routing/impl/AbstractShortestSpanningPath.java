package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public abstract class AbstractShortestSpanningPath<V, E> implements
		SpanningShortestPath<V, E> {

	protected WeightedGraph<V, E> graph ;
	private V source ;
	
	private V currentTarget = null ;
	private double currentWeight = Double.MAX_VALUE;
	
	public AbstractShortestSpanningPath(WeightedGraph<V, E> graph, V source) {
		super();
		this.graph = graph;
		this.source = source;
	}
	
	protected synchronized void update(V vertex, double weight) {
		if (weight < currentWeight) {
			currentWeight = weight;
			currentTarget = vertex;
		}
	}

	protected double find(ClosestFirstSurfaceIterator<V, E> itr, V vertex) {

		if (!itr.isTraversedVertex(vertex)) {
			while (itr.hasNext() && !(itr.next() == vertex)) {
			}
		}

		return itr.getShortestPathLength(vertex);
	}
	
	protected void updateNetworkPath(ClosestFirstSurfaceIterator<V, E> itr, V vertex) {
		update(vertex, find(itr, vertex));
	}
	
	protected double updateNetworkPath(ClosestFirstSurfaceIterator<V, E> itr, Collection<V> vertices) {
		for (V v : vertices) {
			double weight = find(itr, v);
			if (weight < currentWeight) {
				currentWeight = weight;
				currentTarget = v;
			}
		}

		return currentWeight;
	}

	

	protected SpanningGraphPath<V, E> getGraphPath(ClosestFirstSurfaceIterator<V, E> itr) {
		List<E> edgeList = new ArrayList<E>();

		V v = currentTarget;

		while (true) {
			E edge = itr.getSpanningTreeEdge(v);

			if (edge == null) {
				break;
			}

			edgeList.add(edge);
			v = Graphs.getOppositeVertex(graph, edge, v);
		}

		double pathLength = itr.getShortestPathLength(currentTarget);

		return new SpanningGraphPathImpl<V, E>(graph, source, currentTarget,
				edgeList, pathLength);
	}

	@Override
	public double getWeight() {
		return currentWeight;
	}

}
