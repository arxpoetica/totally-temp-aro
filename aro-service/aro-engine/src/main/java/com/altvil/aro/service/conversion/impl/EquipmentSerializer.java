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

public class EquipmentSerializer extends
		GraphMappingSerializer<NetworkNodeAssembler> {

	private Aggregator<LocationDemand> demandAggregator = DefaultLocationDemand
			.demandAggregate();
	private Set<LocationEntity> seenLocations = new HashSet<>();

	public EquipmentSerializer(long planId) {
		super(planId);
	}

	protected NetworkNodeAssembler trackDemand(NetworkNodeAssembler parent,
			NetworkNodeAssembler child) {
		parent.addChildDemand(child.getLocationDemand());
		return child;
	}

	protected void add(LocationEntity entity) {
		if (!seenLocations.contains(entity)) {
			seenLocations.add(entity);
			demandAggregator.add(entity.getLocationDemand());
		}
	}

	protected void serializeCentralOffice(NetworkNodeAssembler parent,
			GraphMapping graphMapping) {
		// TODO Extend Serialization
		NetworkNodeAssembler equipment = new NetworkNodeAssembler(null); // Load
																			// Existing
																			// Data
		register(graphMapping.getGraphAssignment(), equipment);

		serialize(equipment, graphMapping.getChildren());

	}

	@Override
	protected void serializeSplicePoint(NetworkNodeAssembler parent,
			GraphMapping graphMapping) {

		NetworkNodeAssembler equipment = null; // Load Existing
		register(graphMapping.getGraphAssignment(), equipment);

		serialize(equipment, graphMapping.getChildren());

	}

	protected void serializeFdh(NetworkNodeAssembler parent,
			GraphMapping graphMapping) {

		NetworkNodeAssembler node = createNetworkNode(graphMapping
				.getGraphAssignment().getPoint(),
				NetworkNodeTypeEnum.fiber_distribution_hub);

		serialize(register(graphMapping.getGraphAssignment(), node),
				graphMapping.getChildren());

		node.setParent(parent);

	}

	@Override
	protected void serializeBulkFiberTerminals(NetworkNodeAssembler parent,
			GraphMapping graphMapping) {

		BulkFiberTerminal bft = (BulkFiberTerminal) graphMapping.getAroEntity();
		add(bft.getLocationEntity());

		NetworkNodeAssembler node = createNetworkNode(graphMapping.getGraphAssignment()
				.getPoint(),
				NetworkNodeTypeEnum.bulk_distrubution_terminal) ;

		serialize(
				register(
						graphMapping.getGraphAssignment(),
						node),
				graphMapping.getChildren());
		
		node.setParent(parent) ;
	}

	protected void serializeFdt(NetworkNodeAssembler parent,
			GraphMapping graphMapping) {

		NetworkNodeAssembler node = createNetworkNode(graphMapping
				.getGraphAssignment().getPoint(),
				NetworkNodeTypeEnum.fiber_distribution_terminal);

		LocationDemand ld = serializeLocations(
				register(graphMapping.getGraphAssignment(), node),
				graphMapping.getChildAssignments());

		node.addChildDemand(ld) ;
		node.setParent(parent);

	}

	protected NetworkNodeAssembler createNetworkNode(Point point,
			NetworkNodeTypeEnum type) {
		NetworkNode node = new NetworkNode();

		node.setGeogPoint(point);
		node.setLongitude(point.getX());
		node.setLattitude(point.getY());
		node.setPoint(point);
		node.setNodeTypeId(type.getId());
		node.setGeogPoint(point);
		node.setRouteId(planId);

		return new NetworkNodeAssembler(node);
	}

	protected LocationDemand serializeLocations(NetworkNodeAssembler parent,
			Collection<GraphEdgeAssignment> edgeAssignments) {

		Aggregator<LocationDemand> aggregator = DefaultLocationDemand
				.demandAggregate();

		edgeAssignments.forEach(e -> {
			LocationDropAssignment lds = (LocationDropAssignment) e
					.getAroEntity();

			aggregator.add(lds.getAssignedEntityDemand().getLocationDemand());
			add(lds.getLocationEntity());
		});

		return aggregator.apply();

	}

	public LocationDemand getLocationDemand() {
		return demandAggregator.apply();
	}
}
