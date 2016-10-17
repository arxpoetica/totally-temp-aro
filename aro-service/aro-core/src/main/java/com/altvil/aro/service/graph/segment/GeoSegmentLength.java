package com.altvil.aro.service.graph.segment;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;

public class GeoSegmentLength implements MetricEdgeWeight<AroEdge<GeoSegment>> {

	public static MetricEdgeWeight<AroEdge<GeoSegment>> MetricLength = new GeoSegmentLength();

	@Override
	public double getWeight(AroEdge<GeoSegment> edge) {
		GeoSegment gs = edge.getValue();
		if (gs == null) {
			return 0;
		}
		return gs.getLength();
	}

}
