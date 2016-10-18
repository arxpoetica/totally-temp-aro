package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.jgrapht.Graphs;
import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;
import com.altvil.aro.service.graph.alg.routing.spi.UpdateContext;

public class LowMemoryShortestSpanningPath<V, E>  implements
		SpanningShortestPath<V, E> {

	private UpdateContext<V, E> updateContext ;
	private WeightedGraph<V, E> graph;
	private V source;

	private V currentTarget = null;
	private double currentWeight = Double.MAX_VALUE;

	public LowMemoryShortestSpanningPath(UpdateContext<V, E> updateContext,
			WeightedGraph<V, E> graph, V source) {
		super();
		this.updateContext = updateContext;
		this.graph = graph;
		this.source = source;
	}

	@Override
	public double getWeight() {
		return getWeight() ;
	}

	@Override
	public double updateNetworkPath(
			Collection<V> vertices) {

		for (V v : vertices) {
			double weight = find(updateContext.getIterator(v));
			if (weight < currentWeight) {
				currentWeight = weight;
				currentTarget = v;
			}
		}

		return currentWeight;

	}

	private double find(ClosestFirstSurfaceIterator<V, E> itr) {

		if (!itr.isTraversedVertex(source)) {
			while (itr.hasNext() && !(itr.next() == source)) {
			}
		}

		return itr.getShortestPathLength(source);

	}

	protected SpanningGraphPath<V, E> getGraphPath(
			ClosestFirstSurfaceIterator<V, E> itr) {
		List<E> edgeList = new ArrayList<E>();

		V v = source;

		while (true) {
			E edge = itr.getSpanningTreeEdge(v);

			if (edge == null) {
				break;
			}

			edgeList.add(edge);
			v = Graphs.getOppositeVertex(graph, edge, v);
		}

		double pathLength = itr.getShortestPathLength(source);

		Collections.reverse(edgeList);
		return new SpanningGraphPathImpl<V, E>(graph, source, currentTarget,
				edgeList, pathLength);
	}

	@Override
	public SpanningGraphPath<V, E> getGraphPath() {
		return getGraphPath(updateContext.getIterator(currentTarget)) ;
	}	

}
