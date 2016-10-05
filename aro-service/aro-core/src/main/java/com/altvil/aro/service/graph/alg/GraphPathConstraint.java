package com.altvil.aro.service.graph.alg;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface GraphPathConstraint<V, E extends AroEdge<GeoSegment>> {

	public interface MetricDistance<V> {
		double getDistance(V vertex) ;
	}
	
	boolean isValid(MetricDistance<V> metricDistance, GraphPath<V, E> graph);

}
