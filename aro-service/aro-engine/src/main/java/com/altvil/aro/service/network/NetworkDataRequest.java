package com.altvil.aro.service.network;

import java.util.EnumSet;
import java.util.Optional;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.interfaces.NetworkAssignmentModel.SelectionFilter;

public class NetworkDataRequest {

	public static class Modifier {
		private NetworkDataRequest modified;

		public Modifier(NetworkDataRequest modified) {
			super();
			this.modified = modified;
		}

		public Modifier updateMrc(double mrc) {
			modified.mrc = mrc;
			return this;
		}

		public Modifier updateLocationTypes(Set<LocationEntityType> types) {
			this.modified.locationEntities = types;
			return this;
		}

		public Modifier updateSelectionFilters(
				Set<SelectionFilter> selectionFilters) {
			this.modified.selectionFilters = selectionFilters;
			return tjis;
		}

		public Modifier update(AnalysisSelectionMode selectionMode) {
			this.modified.selectionMode = selectionMode;
			return this;
		}

		public Modifier updateQueryPlanConduit(boolean queryPlanConduit) {
			this.modified.queryPlanConduit = queryPlanConduit;
			return this;
		}

		public Modifier updateServiceAreaId(int serviceAreaId) {
			this.modified.serviceAreaId = Optional.of(serviceAreaId);
			return this;
		}

		public Modifier updatePlanId(long planId) {
			this.modified.planId = planId;
			return this;
		}

		public NetworkDataRequest commit() {
			return modified;
		}

	}

	private double mrc;
	private long planId;
	private Integer year;
	private Integer serviceLayerId;
	private boolean queryPlanConduit = false;
	private AnalysisSelectionMode selectionMode;
	private Set<SelectionFilter> selectionFilters = EnumSet
			.of(SelectionFilter.SELECTED);
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

	public Modifier modify() {
		return new Modifier(new NetworkDataRequest(planId, serviceLayerId,
				year, selectionMode, locationEntities, mrc, queryPlanConduit,
				serviceAreaId));
	}

	public NetworkDataRequest createRequest(long planId, int serviceLayerId) {
		return new NetworkDataRequest(planId, serviceLayerId, year,
				selectionMode, locationEntities, mrc, queryPlanConduit,
				serviceAreaId);
	}

	public NetworkDataRequest createRequest(int serviceAreaId) {
		return modify().updateServiceAreaId(serviceAreaId).commit();
	}

	public NetworkDataRequest createRequest(Set<LocationEntityType> types) {
		return modify().updateLocationTypes(types).commit() ;
	}

	public NetworkDataRequest createFilterRequest(
			Set<SelectionFilter> selectionFilters) {
		return modify().updateSelectionFilters(selectionFilters).commit() ;
		
	}

	public NetworkDataRequest includePlanConduit() {
		return modify().updateQueryPlanConduit(true).commit() ;
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
