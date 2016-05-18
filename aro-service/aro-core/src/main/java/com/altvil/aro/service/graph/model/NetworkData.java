package com.altvil.aro.service.graph.model;

import java.util.Collection;
import java.util.Collections;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;


public class NetworkData {

	public Collection<NetworkAssignment> roadLocations;

	//public Map<RoadLocation, CoverageAggregateStatistic> roadLocationsProperties;

	private Collection<NetworkAssignment> fiberSources ;
	private Collection<RoadEdge> roadEdges;
	private Collection<Long> selectedRoadLocationIds;

	public void setCentralOffice(NetworkAssignment fiberSource) {
		setFiberSources(Collections.singleton(fiberSource));
	}

	public Collection<RoadEdge> getRoadEdges() {
		return roadEdges;
	}

	public void setRoadEdges(Collection<RoadEdge> roadEdges) {
		this.roadEdges = roadEdges;
	}

	public Collection<NetworkAssignment> getFiberSources() {
		return fiberSources;
	}

	public void setFiberSources(Collection<NetworkAssignment> fiberSources) {
		this.fiberSources = fiberSources;
	}

	public Collection<NetworkAssignment> getRoadLocations() {
		return roadLocations;
	}

	public void setRoadLocations(Collection<NetworkAssignment> roadLocations) {
		this.roadLocations = roadLocations;
	}

	public Collection<Long> getSelectedRoadLocationIds() {
		return selectedRoadLocationIds;
	}

	public void setSelectedRoadLocationIds(Collection<Long> selectedRoadLocationIds) {
		this.selectedRoadLocationIds = selectedRoadLocationIds;
	}
}
