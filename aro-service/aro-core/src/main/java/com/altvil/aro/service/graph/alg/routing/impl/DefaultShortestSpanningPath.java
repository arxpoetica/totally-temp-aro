package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public class DefaultShortestSpanningPath<V, E> extends
		AbstractShortestSpanningPath<V, E> {

	private ClosestFirstSurfaceIterator<V, E> itr;

	public DefaultShortestSpanningPath(WeightedGraph<V, E> graph, V source, ClosestFirstSurfaceIterator<V, E> itr) {
		super(graph, source);
		this.itr = itr ;
	}

	
	@Override
	public double updateNetworkPath(Collection<V> vertices) {
		return super.updateNetworkPath(itr, vertices);
	}

	@Override
	public SpanningGraphPath<V, E> getGraphPath() {
		return super.getGraphPath(itr);
	}

}
