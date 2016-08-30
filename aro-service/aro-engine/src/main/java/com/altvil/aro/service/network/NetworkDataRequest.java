package com.altvil.aro.service.network;

import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public class NetworkDataRequest {

	private double mrc ;
	private long planId;
	private Integer year;
	private Integer serviceLayerId ;
	private AnalysisSelectionMode selectionMode;
	private Set<LocationEntityType> locationEntities;

	public NetworkDataRequest(long planId,
			Integer serviceLayerId, 
			Integer year,
			AnalysisSelectionMode selectionMode,
			Set<LocationEntityType> locationEntities,
			double mrc) {

		super();
		this.planId = planId;
		this.serviceLayerId = serviceLayerId ;
		this.year = year;
		this.selectionMode = selectionMode;
		this.locationEntities = locationEntities;
		this.mrc = mrc ;
	}
	
	public NetworkDataRequest createRequest(long planId, int serviceLayerId) {
		return new NetworkDataRequest(planId, serviceLayerId, year, selectionMode, locationEntities, mrc) ;
	}
	
	public Integer getServiceLayerId() {
		return serviceLayerId;
	}

	public double getMrc() {
		return mrc;
	}

	public long getPlanId() {
		return planId;
	}

	public AnalysisSelectionMode getSelectionMode() {
		return selectionMode;
	}

	public Integer getYear() {
		return year;
	}

	public Set<LocationEntityType> getLocationEntities() {
		return locationEntities;
	}	

}
