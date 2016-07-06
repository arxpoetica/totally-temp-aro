package com.altvil.aro.service.demand.analysis;

import java.util.Collection;

import com.altvil.aro.service.entity.LocationEntityType;

public class EntityNetworkProfile {

	private LocationEntityType locationEntityType;
	private DemandProfile demandProfile;
	private ArpuMapping arpuMapping;
	private Collection<NetworkCapacity> competitorCapacities;

	public DemandProfile getDemandProfile() {
		return demandProfile;
	}

	public ArpuMapping getArpuMapping() {
		return arpuMapping;
	}

	public void setArpuMapping(ArpuMapping arpuMapping) {
		this.arpuMapping = arpuMapping;
	}

	public void setDemandProfile(DemandProfile demandProfile) {
		this.demandProfile = demandProfile;
	}

	public Collection<NetworkCapacity> getCompetitorCapacities() {
		return competitorCapacities;
	}

	public void setCompetitorCapacities(
			Collection<NetworkCapacity> competitorCapacities) {
		this.competitorCapacities = competitorCapacities;
	}

	public LocationEntityType getLocationEntityType() {
		return locationEntityType;
	}

	public void setLocationEntityType(LocationEntityType locationEntityType) {
		this.locationEntityType = locationEntityType;
	}

}
