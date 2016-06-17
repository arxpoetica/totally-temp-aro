package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.assigment.GraphAssignmentFactory;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.impl.DefaultNetworkModel;
import com.altvil.aro.service.graph.builder.spi.GeoSegmentAssembler;
import com.altvil.aro.service.graph.node.GraphNodeFactory;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.segment.PinnedLocation;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static java.util.stream.Collectors.groupingBy;

public class GraphNetworkBuilder extends AbstractNetworkBuilder {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(GraphNetworkBuilder.class.getName());

	private GraphAssignmentFactory factory;
	
	private Map<Long, List<NetworkAssignment>> networkAssignmentsById;
	private Map<NetworkAssignment, GraphEdgeAssignment> graphEdgeAssignmentMap = new HashMap<>();

	public GraphNetworkBuilder(GraphModelBuilder<GeoSegment> graphModelBuilder,
			GraphNodeFactory vertexFactory, GraphAssignmentFactory factory) {
		super(graphModelBuilder, vertexFactory);
		this.factory = factory;
	}

	public GraphNetworkModel build() {
		return new DefaultNetworkModel(assembleGraph(), getAssignments(), getTotalNumberOfLocations());
	}


	protected Map<NetworkAssignment, GraphEdgeAssignment> getAssignments() {
		return graphEdgeAssignmentMap;
	}

	public GraphNetworkBuilder setNetworkAssignments(
			Collection<NetworkAssignment> networkAssignments) {
		final Map<Long, List<NetworkAssignment>> groupedRoadSegments = groupRoadSegmentId(networkAssignments);

		networkAssignmentsById = mergeLists(networkAssignmentsById, groupedRoadSegments);
		return this;
	}

	protected Map<Long, List<NetworkAssignment>> mergeLists(final Map<Long, List<NetworkAssignment>> primary, final Map<Long, List<NetworkAssignment>> secondary) {
		if (primary == null) {
			return secondary;
		}
		
		final Map<Long, List<NetworkAssignment>> currentMap = primary;
		secondary.entrySet().forEach((me) -> {
			List<NetworkAssignment> current = currentMap.get(me.getKey());
			
			if (current == null) {
				currentMap.put(me.getKey(), me.getValue());
			} else {
				current.addAll(me.getValue());
			}	
		});
		
		return primary;
	}
	
	private Map<Long, List<NetworkAssignment>> groupRoadSegmentId(
			Collection<NetworkAssignment> networkAssignments) {
		return networkAssignments.stream().collect(
				groupingBy(NetworkAssignment::getRoadSegmentId));
	}

	private Collection<NetworkAssignment> getNetworkAssignments(RoadEdge re) {
		return networkAssignmentsById.get(re.getId());
	}

	private void add(NetworkAssignment assignment, PinnedLocation pl) {
		graphEdgeAssignmentMap.put(
				assignment,
				factory.createEdgeAssignment(pl,
						assignment.getSource()));

	}

	protected void mapRoadEdge(RoadEdge edge, GeoSegmentAssembler segment) {
		Collection<NetworkAssignment> networkElements = getNetworkAssignments(edge);
		if (networkElements != null) {
			networkElements.forEach(n -> {
				add(n, segment.pinLocation(n.getDomain()));
			});
		}
	}

}
