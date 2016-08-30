package com.altvil.aro.service.conversion.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
import com.altvil.interfaces.FiberCableConstructionType;
import com.altvil.interfaces.FiberCableConstructionTypeMapping;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.func.AggregatorFactory.DoubleSummer;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;

public class FiberRouteSerializer extends GraphMappingSerializer<FiberRoute> {

	private NetworkModel networkModel;
	private Map<GraphEdgeAssignment, NetworkNodeAssembler> equipmentMapping;
	private Map<FiberCableConstructionType, DoubleSummer> fiberLengthMap = new HashMap<>();

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
					
		FiberRoute fr = new FiberRoute();
		
		fr.setPlanId(planId);
		fr.setFiberRouteType(fiberType);
		fr.setGeometry(createMultiLineString(segments));
		fr.setName("auto-generated") ;
		
		fr.setFiberRouteSegments(toFiberRouteSegments(fr, fiberType, segments));
		
		return fr;
	}
	
	
	
	private Set<FiberRouteSegment> toFiberRouteSegments(FiberRoute fr, FiberType ft, Collection<AroEdge<GeoSegment>> segments) {
	
		Function<Map.Entry<CableConstructionEnum, List<AroEdge<GeoSegment>>>, FiberRouteSegment>  f 
				= e -> {
					
					CableConstructionEnum constructionType = e.getKey() ;
					List<AroEdge<GeoSegment>> segs = e.getValue() ;
					FiberCableConstructionType fct = FiberCableConstructionTypeMapping.MAPPING.getFiberCableConstructionType(ft, constructionType) ;
					
					FiberRouteSegment frs = new FiberRouteSegment() ;
					frs.setFiberRoute(fr);
					frs.setCableConstructionType(constructionType);
					frs.setLengthInMeters(segs.stream().map(AroEdge::getValue).mapToDouble(GeoSegment::getLength).sum());
					
					//TODO Revisit Data Model.
					frs.setGeometry(createMultiLineString(segs));

					//TODO  separate concerns 
					DoubleSummer ds = fiberLengthMap.get(fct) ;
					if(ds == null ) {
						fiberLengthMap.put(fct, ds=new DoubleSummer()) ;
					}
					ds.add(frs.getLengthInMeters());
					
					
					return frs  ;
				} ;
		
		return segments.stream()
					.collect(Collectors.groupingBy(e -> e.getValue().getCableConstructionCategory()))
					.entrySet().stream().map(f).collect(Collectors.toSet()) ;
		
	
	}

	@Override
	protected void serializeFdt(FiberRoute parent, GraphMapping graphMapping) {
		// TODO capture and store Drop cable lengths
	}

	public Map<FiberCableConstructionType, Double> getFiberLengthMap() {
		 Map<FiberCableConstructionType, Double> result = new HashMap<>() ;
		 
		 fiberLengthMap.entrySet().forEach(e -> {
			 result.put(e.getKey(), e.getValue().apply()) ;
		 });
		 
		return result ;
	}

}