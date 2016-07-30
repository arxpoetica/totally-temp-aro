package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.DefaultSplitSegment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations;
import com.altvil.aro.service.graph.segment.impl.DefaultSegmentLocations.LocationEntityAssignment;
import com.altvil.aro.service.graph.segment.splitter.SplitGeoSegment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.utils.GeometryUtil;
import com.vividsolutions.jts.geom.Point;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

@Deprecated
public abstract class AbstractNetworkBuilder {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(RoadLocationBuilder.class.getName());
	protected int totalNumberOfLocations = 0;

	private GraphModelBuilder<GeoSegment> graphModelBuilder;
	private GraphNodeFactory vertexFactory;

	@SuppressWarnings("unused")
	private int doubleCounted = 0;
	@SuppressWarnings("unused")
	private int edgesIn = 0;
	@SuppressWarnings("unused")
	private int edgesOut = 0;

	private Collection<RoadEdge> roadEdges;
	private Map<Long, GraphNode> roadVertexMap = new HashMap<>();
	private Set<Long> seenEdges = new HashSet<>();


	public AbstractNetworkBuilder(
			GraphModelBuilder<GeoSegment> graphModelBuilder,
			GraphNodeFactory vertexFactory) {
		super();
		this.graphModelBuilder = graphModelBuilder;
		this.vertexFactory = vertexFactory;
	}

	public void setRoadEdges(Collection<RoadEdge> roadEdges) {
		this.roadEdges = roadEdges;
	}

	protected void assemble(Collection<RoadEdge> roadEdges) {
		for (RoadEdge re : roadEdges) {
			add(re);
		}
	}

	protected GraphModel<GeoSegment> assembleGraph() {
		assemble(roadEdges);
		return graphModelBuilder.build();
	}

	private GraphNode getRoadVertex(Long id, Point point) {
		GraphNode gn = roadVertexMap.get(id);

		if (gn == null) {
			roadVertexMap.put(id, gn = vertexFactory.createGraphNode(point));
		}

		return gn;

	}

	private GraphNode getLeftVertex(RoadEdge re) {
		return getRoadVertex(re.getTindf(),
				GeometryUtil.getStartPoint(re.getShape()));
	}

	private GraphNode getRightVertex(RoadEdge re) {
		return getRoadVertex(re.getTnidt(),
				GeometryUtil.getEndPoint(re.getShape()));
	}

	protected void add(RoadEdge re) {

		if (!seenEdges.add(re.getId())) {
			doubleCounted++;
		}

		edgesIn++;

		List<LocationEntityAssignment> orderedLocationsByRoadEdge = getOrderedLocationsByRoadEdge(re);
		totalNumberOfLocations += orderedLocationsByRoadEdge.size();
		GeoSegmentAssembler segAssembler = DefaultSegmentLocations.createAssembler(null,
				re.getLengthMeters(), re.getId(), re.getShape(),
				orderedLocationsByRoadEdge);

		GraphNode leftVertex = getLeftVertex(re);
		GraphNode rightVertex = getRightVertex(re);
		
		if (re.getTindf() == re.getTnidt()) {

			PinnedLocation pl = segAssembler.pinLocation(0.333);
			PinnedLocation p2 = segAssembler.pinLocation(0.333 * 2);
			List<PinnedLocation> pins = new ArrayList<>();
			pins.add(pl);
			pins.add(p2);
			SplitGeoSegment splitSegment = DefaultSplitSegment.split(true, segAssembler
					.getGeoSegment(), pins, segAssembler.getGeoSegment().getLineString());
			Collection<GeoSegment> splits = splitSegment.getSubSegments();
			Iterator<GeoSegment> splitsItr = splits.iterator();

			GraphNode point1 = vertexFactory.createGraphNode(pl
					.getIntersectionPoint());

			GraphNode point2 = vertexFactory.createGraphNode(pl
					.getIntersectionPoint());

			add(leftVertex, point1, splitsItr.next());
			add(point1, point2, splitsItr.next());
			add(point2, rightVertex, splitsItr.next());
			mapRoadEdge(re, splitSegment);

		} else {
			if( add(leftVertex, rightVertex, segAssembler.getGeoSegment()) != null ) {
				mapRoadEdge(re, segAssembler);
			} else {
				PinnedLocation pl = segAssembler.pinLocation(0.5);
				List<PinnedLocation> pins = new ArrayList<>();
				pins.add(pl);
				SplitGeoSegment splitSegment = DefaultSplitSegment.split(true, segAssembler
						.getGeoSegment(), pins, segAssembler.getGeoSegment().getLineString());
				Collection<GeoSegment> splits = splitSegment.getSubSegments();
				Iterator<GeoSegment> splitsItr = splits.iterator();

				GraphNode point1 = vertexFactory.createGraphNode(pl
						.getIntersectionPoint());

				add(leftVertex, point1, splitsItr.next());
				add(point1, rightVertex, splitsItr.next());
				mapRoadEdge(re, splitSegment);
			}
			
		}


	}

	private  AroEdge<GeoSegment> add(GraphNode left, GraphNode right, GeoSegment sl) {

		edgesOut++;
		return graphModelBuilder.add(left, right, sl, sl.getLength());

	}

	protected abstract void mapRoadEdge(RoadEdge edge, GeoSegmentAssembler gea);

	protected List<LocationEntityAssignment> getOrderedLocationsByRoadEdge(
			RoadEdge roadEdge) {
		return Collections.emptyList();
	}

	protected int getTotalNumberOfLocations() {
		return totalNumberOfLocations;
	}

}
