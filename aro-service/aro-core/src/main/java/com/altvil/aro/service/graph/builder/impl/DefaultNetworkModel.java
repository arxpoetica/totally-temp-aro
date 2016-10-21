package com.altvil.aro.service.graph.builder.impl;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.interfaces.NetworkAssignment;

import java.util.Collection;
import java.util.Map;

public class DefaultNetworkModel implements GraphNetworkModel {

	private GraphModel<GeoSegment> model;
	private Map<NetworkAssignment, GraphEdgeAssignment> map;
	private int totalNumberOfLocations;
	private final Collection<NetworkAssignment> allAssignments;


	public DefaultNetworkModel(GraphModel<GeoSegment> model, Collection<NetworkAssignment> allAssignments,
							   Map<NetworkAssignment, GraphEdgeAssignment> map, int totalNumberOfLocations) {
		this.model = model;
		this.allAssignments =allAssignments;
		this.map = map;
		this.totalNumberOfLocations = totalNumberOfLocations;
	}

	@Override
	public GraphModel<GeoSegment> getGraphModel() {
		return model;
	}

	@Override
	public GraphEdgeAssignment getGraphEdgeAssignment(NetworkAssignment ref) {
		return map.get(ref);
	}

	@Override
	public Collection<NetworkAssignment> getNetworkAssignments() {
		return map.keySet();
	}

	@Override
	public Collection<GraphEdgeAssignment> getGraphAssignments() {
		return map.values();
	}

	@Override
	public boolean hasLocations() {
		return totalNumberOfLocations > 0;
	}

	@Override
	public Collection<NetworkAssignment> getAssignments(SelectionFilter selectionFilter) {
		switch (selectionFilter){
			case ALL:
				return allAssignments;
			case SELECTED:
				return map.keySet();
			default:
				throw new RuntimeException("unknown selection filter" + selectionFilter);
		}

	}

}
