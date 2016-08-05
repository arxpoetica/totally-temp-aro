package com.altvil.aro.service.graph.model;

import java.util.Collection;
import java.util.Collections;
import java.util.stream.Collectors;

import org.apache.commons.lang3.builder.ToStringBuilder;

import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.interfaces.NetworkAssignment;

public class NetworkData extends EdgeData {

	public Collection<NetworkAssignment> roadLocations;

	// public Map<RoadLocation, CoverageAggregateStatistic>
	// roadLocationsProperties;

	private CompetitiveDemandMapping competitiveDemandMapping ;

	private Collection<NetworkAssignment> fiberSources;
	private Collection<Long> selectedRoadLocationIds;
	
	public void setCentralOffice(NetworkAssignment fiberSource) {
		setFiberSources(Collections.singleton(fiberSource));
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

	public void setSelectedRoadLocationIds(
			Collection<Long> selectedRoadLocationIds) {
		this.selectedRoadLocationIds = selectedRoadLocationIds;
	}
	

	public CompetitiveDemandMapping getCompetitiveDemandMapping() {
		return competitiveDemandMapping;
	}

	public void setCompetitiveDemandMapping(
			CompetitiveDemandMapping competitiveDemandMapping) {
		this.competitiveDemandMapping = competitiveDemandMapping;
	}
		

	public Collection<NetworkAssignment> getSelectedRoadLocations() {
		if (selectedRoadLocationIds == null
				|| selectedRoadLocationIds.isEmpty() || roadLocations == null) {
			return Collections.emptyList();
		}

		return roadLocations
				.stream()
				.filter((rl) -> selectedRoadLocationIds.contains(rl.getSource()
						.getObjectId())).collect(Collectors.toList());
	}

	public String toString() {
		return new ToStringBuilder(this).append("fiberSources", fiberSources)
				.append("roadEdges", getRoadEdges())
				.append("roadLocations", roadLocations)
				.append("selectedRoadLocationIds", selectedRoadLocationIds)
				.toString();
	}
}
