package com.altvil.aro.service.conversion.impl;

import java.util.Collection;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.vividsolutions.jts.geom.Point;

public class EquipmentSerializer extends GraphMappingSerializer<NetworkNode> {
	
	
	public EquipmentSerializer(int planId) {
		super(planId);
	}

	protected void serializeCentralOffice(NetworkNode parent,
			GraphMapping graphMapping) {
		// TODO Extend Serialization
		NetworkNode equipment = null  ; //Load Existing 
		register(graphMapping.getGraphAssignment(), equipment);

		serialize(equipment, graphMapping.getChildren());

	}

	@Override
	protected void serializeSplicePoint(NetworkNode parent,
			GraphMapping graphMapping) {

		NetworkNode equipment = null  ; //Load Existing 
		register(graphMapping.getGraphAssignment(), equipment);

		serialize(equipment, graphMapping.getChildren());

	}

	

	protected void serializeFdh(NetworkNode parent, GraphMapping graphMapping) {

		serialize(
				register(
						graphMapping.getGraphAssignment(),
						createNetworkNode(graphMapping.getGraphAssignment().getPoint(), NetworkNodeType.fiber_distribution_hub)
						), graphMapping.getChildren());

	}

	protected void serializeFdt(NetworkNode parent, GraphMapping graphMapping) {

		serializeLocations(
				register(
						graphMapping.getGraphAssignment(),
						createNetworkNode(graphMapping.getGraphAssignment().getPoint(), 
								NetworkNodeType.fiber_distribution_terminal)),
				graphMapping.getChildAssignments());

	}
	
	
	protected NetworkNode createNetworkNode(Point point, NetworkNodeType type) {
		NetworkNode node = new NetworkNode();

		node.setGeogPoint(point);
		node.setLongitude(point.getX());
		node.setLattitude(point.getY());
		node.setPoint(point);
		node.setNodeTypeId(type.getId());
		node.setGeogPoint(point);
		node.setRouteId(planId);
	
		return node;
	}

	protected void serializeLocations(NetworkNode parent,
			Collection<GraphEdgeAssignment> edgeAssignments) {
		// TODO Save Relationships in the database
	}

}