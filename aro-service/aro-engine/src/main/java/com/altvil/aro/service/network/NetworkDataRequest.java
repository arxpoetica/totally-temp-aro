package com.altvil.aro.service.network;

import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public class NetworkDataRequest {

	private long planId;
	private Integer year;
	private LocationSelectionMode selectionMode;
	private Set<LocationEntityType> locationEntities;

	public NetworkDataRequest(long planId, Integer year,
			LocationSelectionMode selectionMode,
			Set<LocationEntityType> locationEntities) {
		super();
		this.planId = planId;
		this.year = year;
		this.selectionMode = selectionMode;
		this.locationEntities = locationEntities;
	}

	public long getPlanId() {
		return planId;
	}

	public LocationSelectionMode getSelectionMode() {
		return selectionMode;
	}

	public Integer getYear() {
		return year;
	}

	public Set<LocationEntityType> getLocationEntities() {
		return locationEntities;
	}

	public NetworkDataRequest createRequest(long planId,
			LocationSelectionMode selectionMode) {
		return new NetworkDataRequest(planId, year, selectionMode,
				locationEntities);
	}

}
