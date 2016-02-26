package com.altvil.aro.service.conversion.impl;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.segment.FiberType;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.NetworkModel;

public class FiberRouteSerializer extends GraphMappingSerializer<FiberRoute> {

	private NetworkModel networkModel;
	private Map<GraphEdgeAssignment, NetworkNode> equipmentMapping;

	public FiberRouteSerializer(int planId, NetworkModel networkModel,
			Map<GraphEdgeAssignment, NetworkNode> equipmentMapping) {
		super(planId);
		this.networkModel = networkModel;
		this.equipmentMapping = equipmentMapping;
	}

	private FiberRoute write(GraphMapping graphMapping, FiberRoute fiberRoute) {
		register(graphMapping.getGraphAssignment(), fiberRoute);
		return fiberRoute;
	}

	private NetworkNode getEquipmentNodeEntity(GraphMapping gm) {
		return equipmentMapping.get(gm.getGraphAssignment());
	}

	@Override
	protected void serializeCentralOffice(FiberRoute parent,
			GraphMapping graphMapping) {

		NetworkNode parentEquipment = getEquipmentNodeEntity(graphMapping);

		serialize(
				write(graphMapping,
						createFiberRoute(
								networkModel.getCentralOfficeFeederFiber(),
								FiberType.FEEDER, parentEquipment)), //

				graphMapping.getChildren());

	}

	@Override
	protected void serializeSplicePoint(FiberRoute parent,
			GraphMapping graphMapping) {
		NetworkNode parentEquipment = getEquipmentNodeEntity(graphMapping);

		serialize(
				write(graphMapping,
						createFiberRoute(
								networkModel.getCentralOfficeFeederFiber(),
								FiberType.FEEDER, parentEquipment)),
				graphMapping.getChildren());

	}

	@Override
	protected void serializeFdh(FiberRoute parent, GraphMapping graphMapping) {

		NetworkNode parentEquipment = getEquipmentNodeEntity(graphMapping);

		serialize(
				write(graphMapping,
						createFiberRoute(networkModel
								.getFiberRouteForFdh(graphMapping
										.getGraphAssignment()),
								FiberType.DISTRIBUTION, parentEquipment)), // TODO
				// Compute
				// Cable
				// Type
				graphMapping.getChildren());

	}

	private FiberRoute createFiberRoute(
			Collection<AroEdge<GeoSegment>> segments, FiberType fiberType,
			NetworkNode equipment) {
		return null;
	}

	@Override
	protected void serializeFdt(FiberRoute parent, GraphMapping graphMapping) {
		// TODO capture and store Drop cable lengths
	}

}