package com.altvil.aro.service.graph.model;

import com.altvil.aro.service.entity.CoverageAggregateStatistic;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

public class NetworkData {

	public Collection<RoadLocation> roadLocations;


	public Map<RoadLocation, CoverageAggregateStatistic> roadLocationsProperties;

	private Collection<NetworkAssignment> fiberSources ;
	private Collection<RoadEdge> roadEdges;

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

	public Collection<RoadLocation> getRoadLocations() {
		return roadLocations;
	}

	public void setRoadLocations(Collection<RoadLocation> roadLocations) {
		this.roadLocations = roadLocations;
	}


	public Map<RoadLocation, CoverageAggregateStatistic> getRoadLocationsProperties() {
		return roadLocationsProperties;
	}

	public void setRoadLocationsProperties(Map<RoadLocation, CoverageAggregateStatistic> roadLocationsProperties) {
		this.roadLocationsProperties = roadLocationsProperties;
	}



}
