package com.altvil.aro.service.graph.alg.routing.impl;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public class DefaultShortestSpanningPath<V, E> extends
		AbstractShortestSpanningPath<V, E> {

	protected ClosestFirstSurfaceIterator<V, E> itr;

	public DefaultShortestSpanningPath(WeightedGraph<V, E> graph, V source, ClosestFirstSurfaceIterator<V, E> itr) {
		super(graph, source);
		this.itr = itr ;
	}
	
	
	@Override
	public boolean isForced() {
		return false;
	}


	@Override
	public void updateNetworkPath(V vertex) {
		updateNetworkPath(itr, vertex) ;
	}
		

	@Override
	public SpanningGraphPath<V, E> getGraphPath() {
		return super.getGraphPath(itr);
	}

}
