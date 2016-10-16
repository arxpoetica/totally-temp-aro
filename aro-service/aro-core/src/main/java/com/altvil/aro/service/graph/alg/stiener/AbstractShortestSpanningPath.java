package com.altvil.aro.service.graph.alg.stiener;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;

public abstract class AbstractShortestSpanningPath<V, E extends AroEdge<?>> implements
		SpanningShortestPath<V, E> {

	private WeightedGraph<V, E> graph ;
	private V source ;
	
	private V currentTarget = null ;
	private double currentWeight = Double.MAX_VALUE;
	
	public AbstractShortestSpanningPath(WeightedGraph<V, E> graph, V source) {
		super();
		this.graph = graph;
		this.source = source;
	}

	protected double find(ClosestFirstSurfaceIterator<V, E> itr, V vertex) {

		if (!itr.isTraversedVertex(vertex)) {
			while (itr.hasNext() && !(itr.next() == vertex)) {
			}
		}

		return itr.getShortestPathLength(vertex);
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

		return new SpanningGraphPathImpl<V, E>(graph, currentTarget, source,
				edgeList, pathLength);
	}

	@Override
	public double getWeight() {
		return currentWeight;
	}

}
