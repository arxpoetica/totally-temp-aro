package com.altvil.aro.service.graph.model;

import java.util.Collection;
import java.util.Collections;
import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;

@SuppressWarnings("serial")
public class NetworkData extends EdgeData {

	public NetworkAssignmentModel roadLocations;

	// public Map<RoadLocation, CoverageAggregateStatistic>
	// roadLocationsProperties;

	private CompetitiveDemandMapping competitiveDemandMapping ;

	private Collection<NetworkAssignment> fiberSources;

	public NetworkData(){}

	private NetworkData(NetworkAssignmentModel roadLocations, CompetitiveDemandMapping competitiveDemandMapping, Collection<NetworkAssignment> fiberSources) {
		this.roadLocations = roadLocations;
		this.competitiveDemandMapping = competitiveDemandMapping;
		this.fiberSources = fiberSources;
	}

	public void setCentralOffice(NetworkAssignment fiberSource) {
		setFiberSources(Collections.singleton(fiberSource));
	}


	public Collection<NetworkAssignment> getFiberSources() {
		return fiberSources;
	}

	public void setFiberSources(Collection<NetworkAssignment> fiberSources) {
		this.fiberSources = fiberSources;
	}

	public NetworkAssignmentModel getRoadLocations() {
		return roadLocations;
	}

	public void setRoadLocations(NetworkAssignmentModel roadLocations) {
		this.roadLocations = roadLocations;
	}

	public CompetitiveDemandMapping getCompetitiveDemandMapping() {
		return competitiveDemandMapping;
	}

	public void setCompetitiveDemandMapping(
			CompetitiveDemandMapping competitiveDemandMapping) {
		this.competitiveDemandMapping = competitiveDemandMapping;
	}
		
    public NetworkData create(NetworkAssignmentModel.SelectionFilter defaultFilter){

		return new NetworkData(roadLocations.create(defaultFilter), competitiveDemandMapping, fiberSources);
	}

	public String toString() {
		return new ToStringBuilder(this).append("fiberSources", fiberSources)
				.append("roadEdges", getRoadEdges())
				.append("roadLocations", roadLocations)
				.toString();
	}
}
