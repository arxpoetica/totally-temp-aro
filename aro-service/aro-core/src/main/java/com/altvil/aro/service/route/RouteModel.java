package com.altvil.aro.service.route;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.interfaces.Assignment;
import com.altvil.interfaces.NetworkAssignment;

public interface RouteModel {

	Collection<AroEdge<GeoSegment>> planRoute(GraphNode src,
			Collection<GraphNode> targets);

	Collection<SourceRoute<GraphNode, AroEdge<GeoSegment>>> planRoute(
			Collection<GraphNode> sources, Collection<GraphNode> targets);

	GraphModel<GeoSegment> getModel();

	GraphNode getVertex(NetworkAssignment networkAssignment);

	Assignment<GraphEdgeAssignment, GraphNode> createEdgeAssignment(
			NetworkAssignment networkAssignment);

	Collection<GraphNode> getVertices(
			Collection<NetworkAssignment> networkAssignment);

	GraphNode getVertex(GraphAssignment a);

	Collection<NetworkAssignment> getNetworkAssignments(GraphNode graphNode);

	Collection<GraphAssignment> getGraphAssignments(GraphNode graphNode);
}
