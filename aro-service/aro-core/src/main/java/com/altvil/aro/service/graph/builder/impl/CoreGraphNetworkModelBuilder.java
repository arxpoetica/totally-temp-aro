package com.altvil.aro.service.graph.builder.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.GraphModelBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.builder.RoadEdgeInfo;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.DefaultSplitSegment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.segment.RatioSection;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.splitter.SplitGeoSegment;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.vividsolutions.jts.geom.Point;

class CoreGraphNetworkModelBuilder {
	
	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(CoreGraphNetworkModelBuilder.class.getName());


	private GraphAssignmentFactory factory;
	private GraphNodeFactory vertexFactory;
	private GraphModelBuilder<GeoSegment> graphModelBuilder;

	
	private int totalNumberLocations = 0;
	private Map<Long, GraphNode> roadVertexMap = new HashMap<>();
	private Map<NetworkAssignment, GraphEdgeAssignment> graphEdgeAssignmentMap = new HashMap<>();
	private final Collection<NetworkAssignment> allAssignments;

	public CoreGraphNetworkModelBuilder(GraphAssignmentFactory factory,
			GraphNodeFactory vertexFactory,
			GraphModelBuilder<GeoSegment> graphModelBuilder,
			Collection<NetworkAssignment> allAssignments) {
		super();
		this.factory = factory;
		this.vertexFactory = vertexFactory;
		this.graphModelBuilder = graphModelBuilder;	
		this.allAssignments = allAssignments;
	}
	
	public GraphNetworkModel build() {
		return new DefaultNetworkModel(graphModelBuilder.build(), allAssignments, 
				graphEdgeAssignmentMap, totalNumberLocations);
	}

	public void add(RoadEdgeInfo roadEdgeInfo) {

		RoadEdge re = roadEdgeInfo.getRoadEdge();
		GraphNode leftVertex = getLeftVertex(re);
		GraphNode rightVertex = getRightVertex(re);
		int segmentCount = computeMinSections(leftVertex, rightVertex);

		Collection<LocationEntityAssignment> orderedLoctions = roadEdgeInfo
				.getOrderedLocations();
	
		Collection<RatioSection> sections = roadEdgeInfo.getSections();
		
//		if( sections != null ) {
//			for(RatioSection rs : sections) {
//				if( rs.getCableConstruction() != CableConstructionEnum.ESTIMATED) {
//					totalEdgeCount++ ;
//				}
//				
//			}
//		}
		
		totalNumberLocations += orderedLoctions.size();

		write(leftVertex,
				rightVertex,
				re, orderedLoctions,
				expand(sections, segmentCount),
				roadEdgeInfo.getNetworkAssignments());

	}
	

	private int computeMinSections(GraphNode leftVertex, GraphNode rightVertex) {
		if (leftVertex == rightVertex) {
			return 3;
		}

		if (graphModelBuilder.containsEdge(leftVertex, rightVertex)) {
			return 2;
		}

		return 1;
	}

	private Iterator<GraphNode> createVertexIterator(
			Collection<Point> intersectionPoints) {
		return StreamUtil.map(intersectionPoints,
				vertexFactory::createGraphNode).iterator();
	}

	private void assignEquipment(GeoSegmentAssembler assembler,
			Collection<NetworkAssignment> networkElements) {
		if (networkElements != null) {
			networkElements.forEach(n -> {
				add(n, assembler.pinLocation(n.getDomain()));
			});
		}
	}

	private void add(NetworkAssignment assignment, PinnedLocation pl) {
		graphEdgeAssignmentMap.put(assignment,
				factory.createEdgeAssignment(pl, assignment.getSource()));

	}
	
	

	private void write(GraphNode leftVertex,
			GraphNode rightVertex,
			RoadEdge re,
			Collection<LocationEntityAssignment> orderedLoctions, 
			Collection<RatioSection> sections,
			Collection<NetworkAssignment> networkElements) {

		if (sections.size() == 1) {
			
			GeoSegmentAssembler assembler = createGeoSegmentAssembler(re, orderedLoctions,
						sections.iterator().next().getCableConstruction()) ;
			
			GeoSegment gs = assembler.getGeoSegment();
			
			assignEquipment(assembler, networkElements);
			graphModelBuilder.add(leftVertex, rightVertex, gs,
					gs.getLength());
			
			
		} else {
			
			GeoSegmentAssembler assembler = createGeoSegmentAssembler(re, orderedLoctions,
					CableConstructionEnum.ESTIMATED) ;
		
		GeoSegment gs = assembler.getGeoSegment();
	

			SplitGeoSegment split = DefaultSplitSegment.splitSegments(true, gs,
					sections);
			

			assignEquipment(split, networkElements);

			Iterator<GeoSegment> segmentItr = split.getSubSegments().iterator();
			Iterator<GraphNode> vertexItr = createVertexIterator(split
					.getIntersectionPoints());

			while (vertexItr.hasNext()) {
				GraphNode next = vertexItr.next();
				GeoSegment geoSegment = segmentItr.next();
				graphModelBuilder.add(leftVertex, next, geoSegment,
						geoSegment.getLength());
				leftVertex = next;
			}
			GeoSegment geoSegment = segmentItr.next();
			graphModelBuilder.add(leftVertex, rightVertex, geoSegment,
					geoSegment.getLength());
		}

		//

	}

	private GraphNode getLeftVertex(RoadEdge re) {
		return getRoadVertex(re.getTindf(),
				GeometryUtil.getStartPoint(re.getShape()));
	}

	private GraphNode getRightVertex(RoadEdge re) {
		return getRoadVertex(re.getTnidt(),
				GeometryUtil.getEndPoint(re.getShape()));
	}

	private GraphNode getRoadVertex(Long id, Point point) {
		GraphNode gn = roadVertexMap.get(id);

		if (gn == null) {
			roadVertexMap.put(id, gn = vertexFactory.createGraphNode(point));
		}

		return gn;

	}

	private GeoSegmentAssembler createGeoSegmentAssembler(RoadEdge re,
			Collection<LocationEntityAssignment> orderedLocationsByRoadEdge, CableConstructionEnum constructionType) {

		return DefaultSegmentLocations.createAssembler(null,
				constructionType, re.getLengthMeters(), 
				re.getId(),
				re.getShape(),
				orderedLocationsByRoadEdge);
	}

	private Collection<RatioSection> expand(Collection<RatioSection> edges,
			int count) {
		
		if( edges.size() >= count ) {
			return edges ;
		}
		
		int deltaSize = count - edges.size() + 1 ;

		List<RatioSection> result = new ArrayList<>();
		Iterator<RatioSection> itr = edges.iterator();

		result.addAll(itr.next().split(deltaSize));
		while (itr.hasNext()) {
			result.add(itr.next());
		}

		return result;

	}

}
