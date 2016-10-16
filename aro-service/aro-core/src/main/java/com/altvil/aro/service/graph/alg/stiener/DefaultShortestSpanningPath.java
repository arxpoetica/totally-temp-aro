package com.altvil.aro.service.graph.alg.stiener;

import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;

public class DefaultShortestSpanningPath<V, E extends AroEdge<?>> extends
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
