package com.altvil.aro.service.route.impl;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphAssignment;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.interfaces.NetworkAssignment;

interface NodedModel {

	public abstract GraphModel<GeoSegment> getModel();

	public abstract GraphNode getVertex(NetworkAssignment networkAssignment);

	public abstract GraphNode getVertex(GraphAssignment a);

	public Collection<AroEdge<GeoSegment>> planRoute(NetworkAssignment src,
			Collection<NetworkAssignment> targets);

}