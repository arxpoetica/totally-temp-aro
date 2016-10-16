package com.altvil.aro.service.graph.alg.stiener;

import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;

public class LowMemoryShortestSpanningPath<V, E extends AroEdge<?>> extends
		AbstractShortestSpanningPath<V, E> {

	private WeightedGraph<V, E> graph ;
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
