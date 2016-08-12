package com.altvil.aro.service.graph.alg;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DistanceGraphPathConstraint<V, E extends AroEdge<GeoSegment>>
		implements GraphPathConstraint<V, AroEdge<GeoSegment>> {

	private double distanceInMeters;

	public DistanceGraphPathConstraint(double distanceInMeters) {
		super();
		this.distanceInMeters = distanceInMeters;
	}

	@Override
	public boolean isValid(SourceRoute<V, AroEdge<GeoSegment>> sourceRoot,
			GraphPath<V, AroEdge<GeoSegment>> graphPath) {

		double pathLength = graphPath.getEdgeList().stream()
				.mapToDouble(e -> e.getValue().getLength()).sum();
		double distance = sourceRoot.getDistance(graphPath.getEndVertex());

		return (distance + pathLength) <= distanceInMeters;

	}

}
