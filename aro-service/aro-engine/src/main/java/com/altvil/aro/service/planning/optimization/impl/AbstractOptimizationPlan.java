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
	private int year = 2015;
	private Set<LocationEntityType> locationEntityTypes = new HashSet<>() ;
	
	
	protected AbstractOptimizationPlan(OptimizationType optimizationType) {
		this.optimizationType = optimizationType;
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId) {
		try {
			AbstractOptimizationPlan copy = (AbstractOptimizationPlan) this.clone();
			copy.planId = planId;
			return (T) copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
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
	public Set<LocationEntityType> getLocationEntityTypes() {
		return locationEntityTypes ;
	}

	public void setLocationEntityTypes(Set<LocationEntityType> locationEntityTypes) {
		this.locationEntityTypes = locationEntityTypes;
	}
	
	
	
}
