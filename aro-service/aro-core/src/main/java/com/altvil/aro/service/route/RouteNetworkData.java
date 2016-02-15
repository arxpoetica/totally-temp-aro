package com.altvil.aro.service.route;

import java.util.Collection;

import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;

public class RouteNetworkData {

	public Collection<RoadEdge> roadEdges;
	private Collection<NetworkAssignment> networkAssignments;

	public Collection<RoadEdge> getRoadEdges() {
		return roadEdges;
	}

	public void setRoadEdges(Collection<RoadEdge> roadEdges) {
		this.roadEdges = roadEdges;
	}

	public Collection<NetworkAssignment> getNetworkAssignments() {
		return networkAssignments;
	}

	public void setNetworkAssignments(
			Collection<NetworkAssignment> networkAssignments) {
		this.networkAssignments = networkAssignments;
	}

	

}
