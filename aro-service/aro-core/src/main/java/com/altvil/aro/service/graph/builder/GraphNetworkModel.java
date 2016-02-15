package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.interfaces.NetworkAssignment;

import java.util.Collection;

public interface GraphNetworkModel {

	public GraphModel<GeoSegment> getGraphModel();
	public GraphEdgeAssignment getGraphEdgeAssignment(NetworkAssignment ref) ;
	public Collection<NetworkAssignment> getNetworkAssignments() ;
	public Collection<GraphEdgeAssignment> getGraphAssignments() ;

	boolean hasLocations();

}
