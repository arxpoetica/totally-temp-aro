package com.altvil.aro.service.network;

import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public class NetworkDataRequest {

	private double mrc ;
	private long planId;
	private Integer year;
	private LocationSelectionMode selectionMode;
	private Set<LocationEntityType> locationEntities;

	public NetworkDataRequest(long planId, Integer year,
			LocationSelectionMode selectionMode,
			Set<LocationEntityType> locationEntities, double mrc) {
		super();
		this.planId = planId;
		this.year = year;
		this.selectionMode = selectionMode;
		this.locationEntities = locationEntities;
		this.mrc = mrc ;
	}
	
	public NetworkDataRequest create(long planId) {
		return new NetworkDataRequest(planId, year, selectionMode, locationEntities, mrc) ;
	}
	
	public double getMrc() {
		return mrc;
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
				locationEntities, mrc);
	}

}
