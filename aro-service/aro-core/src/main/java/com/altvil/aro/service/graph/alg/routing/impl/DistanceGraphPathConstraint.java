package com.altvil.aro.service.graph.alg.routing.impl;

import org.jgrapht.GraphPath;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DistanceGraphPathConstraint<V, E extends AroEdge<GeoSegment>>
		implements GraphPathConstraint<V, AroEdge<GeoSegment>> {

	private static final Logger log = LoggerFactory
			.getLogger(DistanceGraphPathConstraint.class.getName());
	
	private double distanceInMeters;

	public DistanceGraphPathConstraint(double distanceInMeters) {
		super();
		this.distanceInMeters = distanceInMeters;
	}

	@Override
	public boolean isValid(MetricDistance<V> metricDistance,
			GraphPath<V, AroEdge<GeoSegment>> graphPath) {
		
		if( graphPath == null ) {
			return true ;
		}

		double pathLength = graphPath.getEdgeList().stream()
				.mapToDouble(e -> e.getValue() == null ? 0 : e.getValue().getLength()).sum();
		double distance = metricDistance.getDistance(graphPath.getEndVertex());
		double totalDistance = distance + pathLength ;
		
		
		if(  log.isInfoEnabled() && totalDistance >= distanceInMeters ) {
			log.info("Route Condition Failed " + totalDistance) ;
		}
		
		
		return totalDistance <= distanceInMeters;

	}

}
