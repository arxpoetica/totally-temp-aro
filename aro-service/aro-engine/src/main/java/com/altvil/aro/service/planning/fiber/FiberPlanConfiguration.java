package com.altvil.aro.service.planning.fiber;

import java.util.function.Predicate;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface FiberPlanConfiguration {
	AbstractFiberPlan getFiberPlan();
	
	<T extends FiberPlanConfiguration> T dependentPlan(long dependentId);

	boolean isFilteringRoadLocationDemandsBySelection();

	boolean isFilteringRoadLocationsBySelection();

	Predicate<AroEdge<GeoSegment>> getSelectedEdges(NetworkData networkData);

	ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder();
}
