package com.altvil.aro.service.network.model;

import java.io.Serializable;
import java.util.Map;

import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.interfaces.RoadLocation;

@SuppressWarnings("serial")
public class LocationData implements Serializable {

	private Map<Long, CompetitiveLocationDemandMapping> demandMapping;
	private Map<Long, RoadLocation> locationData;

	public LocationData(
			Map<Long, CompetitiveLocationDemandMapping> demandMapping,
			Map<Long, RoadLocation> locationData) {
		super();
		this.demandMapping = demandMapping;
		this.locationData = locationData;
	}

	Map<Long, CompetitiveLocationDemandMapping> getAllDemandMapping() {
		return demandMapping;
	}

	Map<Long, RoadLocation> getAllRoadLocations(Long planId) {
		return locationData;
	}

}
