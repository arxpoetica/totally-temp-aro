package com.altvil.aro.service.conversion.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import com.altvil.aro.model.FiberRoute;
import com.altvil.aro.model.FiberRouteSegment;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.service.analysis.GraphMappingSerializer;
import com.altvil.aro.service.entity.FiberType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.assigment.GraphMapping;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.AggregatorFactory.DoubleSummer;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;

public class FiberRouteSerializer extends GraphMappingSerializer<FiberRoute> {

	private NetworkModel networkModel;
	private Map<GraphEdgeAssignment, NetworkNodeAssembler> equipmentMapping;
	private Map<FiberType, DoubleSummer> fiberLengthMap = new EnumMap<>(FiberType.class);

	public FiberRouteSerializer(long planId, NetworkModel networkModel,
			Map<GraphEdgeAssignment, NetworkNodeAssembler> equipmentMapping) {
		super(planId);
		this.networkModel = networkModel;
		this.equipmentMapping = equipmentMapping;
	}

	private FiberRoute write(GraphMapping graphMapping, FiberRoute fiberRoute) {
		register(graphMapping.getGraphAssignment(), fiberRoute);
		return fiberRoute;
	}

	private NetworkNode getEquipmentNodeEntity(GraphMapping gm) {
		NetworkNodeAssembler na = equipmentMapping.get(gm.getGraphAssignment());
		return na == null ? null : na.getNetworkNode() ;
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
			GeneratedFiberRoute route, FiberType fiberType,
			NetworkNode equipment) {

		
		Collection<AroEdge<GeoSegment>> segments = route.getEdges() ;
		
		double length = segments.stream().mapToDouble(e -> e.getValue().getLength()).sum() ;
		DoubleSummer ds = fiberLengthMap.get(fiberType) ;

		if(ds == null ) {
			fiberLengthMap.put(fiberType, ds=new DoubleSummer()) ;
		}
		ds.add(length);
		
		FiberRoute fr = new FiberRoute();
		
		fr.setPlanId(planId);
		fr.setFiberRouteType(fiberType);
		fr.setGeometry(createMultiLineString(segments));
		fr.setName("auto-generated") ;
		
		return fr;
	}
	
	private Function<Map.Entry<CableConstructionEnum, List<AroEdge<GeoSegment>>>, FiberRouteSegment> createFuncToFiberRouteSegment(FiberRoute fr) {
		
		return e -> {
			
			FiberRouteSegment frs = new FiberRouteSegment() ;
			frs.setFiberRoute(fr);
			frs.setGeometry(createMultiLineString(e.getValue()));
			return frs  ;
		} ;
	}
	
	private void x(FiberRoute fr, Collection<AroEdge<GeoSegment>> segments) {
	
		Function<Map.Entry<CableConstructionEnum, List<AroEdge<GeoSegment>>>, FiberRouteSegment>  f 
				= createFuncToFiberRouteSegment(fr) ;
		
		segments.stream()
					.collect(Collectors.groupingBy(e -> e.getValue().getCableConstructionCategory()))
					.entrySet() ;
		StreamUtil.hash(segments, e -> e.getValue().getCableConstructionCategory()) ;
	}

	@Override
	protected void serializeFdt(FiberRoute parent, GraphMapping graphMapping) {
		// TODO capture and store Drop cable lengths
	}

	public Map<FiberType, Double> getFiberLengthMap() {
		 Map<FiberType, Double> result = new HashMap<>() ;
		 
		 fiberLengthMap.entrySet().forEach(e -> {
			 result.put(e.getKey(), e.getValue().apply()) ;
		 });
		 
		return result ;
	}

}