package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.ClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint.MetricLinkDistance;
import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public class ForcedSpanningPath<V, E> extends DefaultShortestSpanningPath<V, E> {

	private GraphPathConstraint<V, E> constraint;
	private MetricLinkDistance<V> metricLengthDistance ;

	public ForcedSpanningPath(WeightedGraph<V, E> graph, V source,
			ClosestFirstSurfaceIterator<V, E> itr,
			GraphPathConstraint<V, E> constraint,
			 MetricLinkDistance<V> metricLengthDistance) {
		super(graph, source, itr);

		this.constraint = constraint;
		this.metricLengthDistance =  metricLengthDistance ;
		
	}

	@Override
	public synchronized void updateNetworkPath(V vertex) {
		super.updateNetworkPath(vertex);
	}

	@Override
	public synchronized SpanningGraphPath<V, E> getGraphPath() {
		return super.getGraphPath();
	}

	@Override
	public synchronized double updateNetworkPath(Collection<V> vertices) {
		return super.updateNetworkPath(vertices);
	}

	

	@Override
	protected void updateNetworkPath(
			ClosestFirstSurfaceIterator<V, E> itr, V vertex) {
		double val = find(itr, vertex);
		if (constraint.isValid(metricLengthDistance, getGraphPath(itr, vertex))) {
			update(vertex, val);
		}
		
		if( val ==  Double.POSITIVE_INFINITY ) {
			throw new RuntimeException("Failed") ;
		}
	}

	@Override
	public boolean isForced() {
		return true;
	}

}
