package com.altvil.aro.service.conversion.impl;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeTypeEnum;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.utils.func.Aggregator;
import com.vividsolutions.jts.geom.Point;

public class EquipmentSerializer extends GraphMappingSerializer<NetworkNode> {

	private Aggregator<LocationDemand> demandAggregator = DefaultLocationDemand.demandAggregate();
	private Set<LocationEntity> seenLocations = new HashSet<>() ;
	
	public EquipmentSerializer(long planId) {
		super(planId);
	}
	
	
	protected void add(LocationEntity entity) {
		if( !seenLocations.contains(entity) ) {
			seenLocations.add(entity) ;
			demandAggregator.add(entity.getLocationDemand()) ;
		}
	}

	protected void serializeCentralOffice(NetworkNode parent,
			GraphMapping graphMapping) {
		// TODO Extend Serialization
		NetworkNode equipment = null; // Load Existing
		register(graphMapping.getGraphAssignment(), equipment);

		serialize(equipment, graphMapping.getChildren());

	}

	@Override
	protected void serializeSplicePoint(NetworkNode parent,
			GraphMapping graphMapping) {

		NetworkNode equipment = null; // Load Existing
		register(graphMapping.getGraphAssignment(), equipment);

		serialize(equipment, graphMapping.getChildren());

	}

	protected void serializeFdh(NetworkNode parent, GraphMapping graphMapping) {

		serialize(
				register(
						graphMapping.getGraphAssignment(),
						createNetworkNode(graphMapping.getGraphAssignment()
								.getPoint(),
								NetworkNodeTypeEnum.fiber_distribution_hub)),
				graphMapping.getChildren());

	}

	@Override
	protected void serializeBulkFiberTerminals(NetworkNode parent,
			GraphMapping graphMapping) {

		BulkFiberTerminal bft = (BulkFiberTerminal) graphMapping.getAroEntity();
		add(bft.getLocationEntity()) ;

		try {
			createNetworkNode(graphMapping.getGraphAssignment().getPoint(),
					NetworkNodeTypeEnum.bulk_distrubution_terminal);
		} catch (Throwable err) {
			err.printStackTrace();
		}

		serialize(
				register(
						graphMapping.getGraphAssignment(),
						createNetworkNode(graphMapping.getGraphAssignment()
								.getPoint(),
								NetworkNodeTypeEnum.bulk_distrubution_terminal)),
				graphMapping.getChildren());

	}

	protected void serializeFdt(NetworkNode parent, GraphMapping graphMapping) {

		serializeLocations(
				register(
						graphMapping.getGraphAssignment(),
						createNetworkNode(graphMapping.getGraphAssignment()
								.getPoint(),
								NetworkNodeTypeEnum.fiber_distribution_terminal)),
				graphMapping.getChildAssignments());

	}

	protected NetworkNode createNetworkNode(Point point,
			NetworkNodeTypeEnum type) {
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
		
		edgeAssignments.forEach(e -> {
			add(((LocationDropAssignment) e
					.getAroEntity()).getLocationEntity());
		});
		
		
	}
	

	public LocationDemand getLocationDemand() {
		return demandAggregator.apply() ;
	}
}
