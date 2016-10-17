package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public class LowMemoryShortestSpanningPath<V, E> extends
		AbstractShortestSpanningPath<V, E> {

	private V source ;
	
	public LowMemoryShortestSpanningPath(WeightedGraph<V, E> graph, V source) {
		super(graph, source);
	}
	
	protected ClosestFirstSurfaceIterator<V, E> createIterator() {
		return new ScalarClosestFirstSurfaceIterator<>(graph, source);
	}
	
	@Override
	public double updateNetworkPath(Collection<V> vertices) {
		ClosestFirstSurfaceIterator<V, E> itr = createIterator() ;
		return  super.updateNetworkPath(itr, vertices);
	}

	@Override
	public SpanningGraphPath<V, E> getGraphPath() {
		return super.getGraphPath(createIterator()) ;
	}

}
