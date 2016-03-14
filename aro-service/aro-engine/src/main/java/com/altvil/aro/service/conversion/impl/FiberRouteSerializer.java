package com.altvil.aro.service.conversion.impl;

import java.util.Collection;
import java.util.Map;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;

public class FiberRouteSerializer extends GraphMappingSerializer<FiberRoute> {

	private NetworkModel networkModel;
	private Map<GraphEdgeAssignment, NetworkNode> equipmentMapping;

	public FiberRouteSerializer(long planId, NetworkModel networkModel,
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

	private MultiLineString createMultiLineString(
			Collection<AroEdge<GeoSegment>> segments) {

		return GeometryUtil.createMultiLineString(StreamUtil.map(segments,
				s -> (LineString) s.getValue().getLineString()));
	}

	private FiberRoute createFiberRoute(
			Collection<AroEdge<GeoSegment>> segments, FiberType fiberType,
			NetworkNode equipment) {

		FiberRoute fr = new FiberRoute();
		
		fr.setPlanId(planId);
		fr.setFiberRouteType(fiberType);
		fr.setGeometry(createMultiLineString(segments));
		fr.setName("auto-generated") ;
		
		return fr;
	}

	@Override
	protected void serializeFdt(FiberRoute parent, GraphMapping graphMapping) {
		// TODO capture and store Drop cable lengths
	}

}