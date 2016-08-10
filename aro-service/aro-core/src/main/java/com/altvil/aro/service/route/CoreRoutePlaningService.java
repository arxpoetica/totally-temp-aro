package com.altvil.aro.service.route;

import java.util.Collection;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GeneratedFiberRoute;

public interface CoreRoutePlaningService {
	
	GraphModel<GeoSegment> getModel();
	
	GeneratedFiberRoute planRoute(GraphNode src,
			Collection<GraphNode> targets);

	GeneratedFiberRoute planRoute(
			Collection<GraphNode> sources, Collection<GraphNode> targets);

	
//	GraphEdgeAssignment<GraphEdgeAssignment, GraphNode> createEdgeAssignment(
//			NetworkAssignment networkAssignment);


//	GraphNode getVertex(GraphAssignment a);
//
//	
//	Collection<GraphAssignment> getGraphAssignments(GraphNode graphNode);

}
