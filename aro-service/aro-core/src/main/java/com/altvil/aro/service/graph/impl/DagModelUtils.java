package com.altvil.aro.service.graph.impl;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;

public class DagModelUtils {

	public static PinnedLocation createPinnedLocation(DAGModel<GeoSegment> dag,
			GraphNode vertex) {

		AroEdge<GeoSegment> edge = dag.getAsDirectedGraph()
				.incomingEdgesOf(vertex).iterator().next();
		PinnedLocation pl = edge.getValue().pinLocation(1.0);

		if (pl.getGeoSegment().getGid() != null) {
			return pl;
		}

		edge = dag.getAsDirectedGraph().incomingEdgesOf(edge.getSourceNode())
				.iterator().next();
		
		return edge.getValue().pinLocation(pl.getPoint());

	}
}
