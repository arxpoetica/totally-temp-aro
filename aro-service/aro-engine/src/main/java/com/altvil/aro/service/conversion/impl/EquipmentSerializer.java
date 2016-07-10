package com.altvil.aro.service.conversion.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeTypeEnum;
import com.altvil.aro.service.analysis.GraphMappingSerializer;
import com.altvil.aro.service.conversion.EquipmentLocationMapping;
import com.altvil.aro.service.conversion.MappedBftAssignment;
import com.altvil.aro.service.conversion.MappedFdtLocations;
import com.altvil.aro.service.demand.impl.DefaultDemandStatistic;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDropAssignment;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.optimize.impl.DefaultFiberCoverage;
import com.altvil.aro.service.optimize.model.DemandCoverage;
import com.altvil.utils.func.Aggregator;
import com.vividsolutions.jts.geom.Point;

public class EquipmentSerializer extends
		GraphMappingSerializer<NetworkNodeAssembler> {

	private DefaultFiberCoverage.Accumulator demandAggregator = DefaultFiberCoverage
			.accumulate();

	private Collection<EquipmentLocationMapping> mappedLocations = new ArrayList<>();
	private DemandCoverage demandCoverage;

	public EquipmentSerializer(long planId) {
		super(planId);
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

		NetworkNodeAssembler node = createNetworkNode(graphMapping
				.getGraphAssignment().getPoint(),
				NetworkNodeTypeEnum.bulk_distrubution_terminal);

		serialize(register(graphMapping.getGraphAssignment(), node),
				graphMapping.getChildren());

		node.setParent(parent,
				serializeBftLocations(node, bft.getAssignedEntityDemand()));
	}

	protected void serializeFdt(NetworkNodeAssembler parent,
			GraphMapping graphMapping) {

		NetworkNodeAssembler node = createNetworkNode(graphMapping
				.getGraphAssignment().getPoint(),
				NetworkNodeTypeEnum.fiber_distribution_terminal);

		register(graphMapping.getGraphAssignment(), node);

		node.setParent(parent,
				serializeFdtLocations(node, graphMapping.getChildAssignments()));

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

	protected <T extends EquipmentLocationMapping> T add(T ml) {
		this.mappedLocations.add(ml);
		ml.getAssignedEntityDemands().forEach(demandAggregator::add);
		return ml;
	}

	protected MappedFdtLocations serializeFdtLocations(
			NetworkNodeAssembler fdt,
			Collection<GraphEdgeAssignment> edgeAssignments) {

		List<LocationDropAssignment> dropAssigments = new ArrayList<>(edgeAssignments.size());
		Aggregator<DemandStatistic> aggregator = DefaultDemandStatistic
				.aggregate();

		edgeAssignments.stream()
				.map(e -> (LocationDropAssignment) e.getAroEntity())
				.forEach(lds -> {
					dropAssigments.add(lds) ;
					aggregator.add(lds.getAssignedEntityDemand().getLocationDemand());
				});

		return add(new MappedFdtLocations(fdt, dropAssigments,
				aggregator.apply()));
	}

	protected MappedBftAssignment serializeBftLocations(
			NetworkNodeAssembler bft, AssignedEntityDemand assignment) {
		return add(new MappedBftAssignment(bft, assignment));
	}

	public Collection<EquipmentLocationMapping> getEquipmentLocationMappings() {
		return mappedLocations;
	}

	public DemandCoverage getDemandCoverage() {
		if (demandCoverage == null) {
			demandCoverage = this.demandAggregator.getResult();
		}
		return demandCoverage;
	}
}
