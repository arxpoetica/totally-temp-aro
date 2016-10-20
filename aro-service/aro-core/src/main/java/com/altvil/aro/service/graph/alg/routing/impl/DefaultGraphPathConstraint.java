package com.altvil.aro.service.graph.alg.routing.impl;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DefaultGraphPathConstraint<V, E extends AroEdge<GeoSegment>>
		implements GraphPathConstraint<V, E> {

	private static GraphPathConstraint<?, AroEdge<GeoSegment>> CONSTRAINT = new DefaultGraphPathConstraint<>();

	@SuppressWarnings("unchecked")
	public static <V> GraphPathConstraint<V, AroEdge<GeoSegment>> constraint() {
		return (GraphPathConstraint<V, AroEdge<GeoSegment>>) CONSTRAINT;
	}

	@Override
	public boolean isValid(MetricLinkDistance<V> metricDistance, GraphPath<V, E> graph) {
		return true;
	}
}
