package com.altvil.aro.service.network;

import java.util.Optional;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.altvil.interfaces.NetworkAssignmentModel.SelectionFilter;

public class NetworkDataRequest {

	private double mrc;
	private long planId;
	private Integer year;
	private Integer serviceLayerId;
	private boolean queryPlanConduit = false;
	private AnalysisSelectionMode selectionMode;
	private Set<SelectionFilter> selectionFilters;
	private Set<LocationEntityType> locationEntities;
	private Optional<Integer> serviceAreaId = Optional.empty();

	public NetworkDataRequest(long planId, Integer serviceLayerId,
			Integer year, AnalysisSelectionMode selectionMode,
			Set<LocationEntityType> locationEntities, double mrc,
			boolean queryPlanConduit, Optional<Integer> serviceAreaId) {

		super();
		this.planId = planId;
		this.serviceLayerId = serviceLayerId;
		this.year = year;
		this.selectionMode = selectionMode;
		this.queryPlanConduit = queryPlanConduit;
		this.locationEntities = locationEntities;
		this.mrc = mrc;
		this.serviceAreaId = serviceAreaId;
	}
	
	public NetworkDataRequest createRequest(long planId, int serviceLayerId) {
		return new NetworkDataRequest(planId, serviceLayerId, year, selectionMode, locationEntities, mrc, queryPlanConduit, serviceAreaId) ;
	}
	public NetworkDataRequest createRequest(int serviceAreaId) {
		return new NetworkDataRequest(planId, serviceLayerId, year, selectionMode, locationEntities, mrc, queryPlanConduit, Optional.of(serviceAreaId));
	}
	
	public NetworkDataRequest createRequest(Set<LocationEntityType> types) {
		return new NetworkDataRequest(planId, serviceLayerId, year, selectionMode, types, mrc, queryPlanConduit, serviceAreaId) ;
	}

	public NetworkDataRequest includePlanConduit() {
		return new NetworkDataRequest(planId, serviceLayerId, year,
				selectionMode, locationEntities, mrc, true, serviceAreaId);
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

	public boolean isQueryPlanConduit() {
		return queryPlanConduit;
	}

	public Optional<Integer> getServiceAreaId() {
		return serviceAreaId;
	}

	public Set<SelectionFilter> getSelectionFilters() {
		return selectionFilters;
	}
}
