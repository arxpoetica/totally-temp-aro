package com.altvil.aro.service.network;

import java.util.Optional;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;

public class NetworkDataRequest {

	private double mrc ;
	private long planId;
	private Integer year;
	private Integer serviceLayerId ;
	private AnalysisSelectionMode selectionMode;
	private Set<LocationEntityType> locationEntities;
	private Optional<Integer> serviceAreaId = Optional.empty();

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
		this.mrc = mrc;
	}

	protected NetworkDataRequest(long planId,
							  Integer serviceLayerId,
							  Integer year,
							  AnalysisSelectionMode selectionMode,
							  Set<LocationEntityType> locationEntities,
							  double mrc,
								 Optional<Integer> serviceAreaId
	) {

		super();
		this.planId = planId;
		this.serviceLayerId = serviceLayerId ;
		this.year = year;
		this.selectionMode = selectionMode;
		this.locationEntities = locationEntities;
		this.mrc = mrc;
		this.serviceAreaId = serviceAreaId;
	}
	
	public NetworkDataRequest createRequest(long planId, int serviceLayerId) {
		return new NetworkDataRequest(planId, serviceLayerId, year, selectionMode, locationEntities, mrc, serviceAreaId) ;
	}
	public NetworkDataRequest createRequest(int serviceAreaId) {
		return new NetworkDataRequest(planId, serviceLayerId, year, selectionMode, locationEntities, mrc, Optional.of(serviceAreaId));
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
