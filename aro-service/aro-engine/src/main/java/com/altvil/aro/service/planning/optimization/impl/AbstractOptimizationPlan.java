package com.altvil.aro.service.planning.optimization.impl;

import java.util.HashSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public abstract class AbstractOptimizationPlan implements OptimizationPlan {
	private final OptimizationType optimizationType;
	private long						   planId;
	private long masterPlanId;
	private int year = 2015;
	private Set<LocationEntityType> locationEntityTypes = new HashSet<>() ;
	private Set<Integer> wireCenterIds = new HashSet<>() ;
	private FiberNetworkConstraints fiberNetworkConstraints;
	
	protected AbstractOptimizationPlan(OptimizationType optimizationType) {
		this.optimizationType = optimizationType;
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId, int wireCenterId) {
		try {
			AbstractOptimizationPlan copy = (AbstractOptimizationPlan) this.clone();
			copy.planId = planId;
			copy.masterPlanId = this.planId;
			Set<Integer> dependentWireCenters = new HashSet<>();
			dependentWireCenters.add(wireCenterId);
			copy.wireCenterIds = dependentWireCenters;
			return (T) copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	}

	@Override
	public long getMasterPlanId() {
		return masterPlanId;
	}

	@Override
	public Set<Integer> getSelectedWireCenters() {
		return wireCenterIds;
	}

	@Override
	public OptimizationType getOptimizationType() {
		return optimizationType;
	}

	@Override
	public long getPlanId() {
		return planId;
	}

	@Override
	public int getYear() {
		return year;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}
	
	public void setYear(int year) {
		this.year = year;
	}

	
	@Override
	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	public void setFiberNetworkConstraints(FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

	@Override
	public Set<LocationEntityType> getLocationEntityTypes() {
		return locationEntityTypes ;
	}

	public void setLocationEntityTypes(Set<LocationEntityType> locationEntityTypes) {
		this.locationEntityTypes = locationEntityTypes;
	}

	public Set<Integer> getWireCenterIds() {
		return wireCenterIds;
	}

	public void setWireCenterIds(Set<Integer> wireCenterIds) {
		this.wireCenterIds = wireCenterIds;
	}
	
}
