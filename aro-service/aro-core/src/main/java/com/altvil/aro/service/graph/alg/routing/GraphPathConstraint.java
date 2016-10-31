package com.altvil.aro.service.graph.alg.routing;

import org.jgrapht.GraphPath;

public interface GraphPathConstraint<V, E> {

	public interface MetricLinkDistance<V> {
		double getLinkDistance(V vertex) ;
	}
	
	boolean isValid(MetricLinkDistance<V> metricDistance, GraphPath<V, E> graph);

}
