package com.altvil.aro.service.graph.alg.routing;

import org.jgrapht.GraphPath;

public interface GraphPathConstraint<V, E> {

	public interface MetricDistance<V> {
		double getDistance(V vertex) ;
	}
	
	boolean isValid(MetricDistance<V> metricDistance, GraphPath<V, E> graph);

}
