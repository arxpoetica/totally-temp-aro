package com.altvil.aro.service.planning.fiber.impl;

import java.util.HashSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public abstract class AbstractFiberPlan implements Cloneable, FiberPlan {
	private final FiberPlanAlgorithm algorithm;
	private FiberNetworkConstraints fiberNetworkConstraints;
	private long					planId;
	private int year = 2015;
	private Set<LocationEntityType> locationEntityTypes ;
	private Set<Integer> selectedWireCenters = new HashSet<>() ;

	protected AbstractFiberPlan(FiberPlanAlgorithm algorithm) {
		this.algorithm = algorithm;
	}

	public final <T extends AbstractFiberPlan> T dependentFiberPlan(long planId) {
		try {
			@SuppressWarnings("unchecked")
			T copy = (T) this.clone();
			copy.setPlanId(planId);
			return copy;
		} catch (CloneNotSupportedException e) {
		}
		
		return null;
	}

	@Override
	public FiberPlanAlgorithm getAlgorithm() {
		return algorithm;
	}

	@Override
	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberNetworkConstraints;
	}

	@Override
	public long getPlanId() {
		return planId;
	}

	@Override
	public int getYear() {
		return year;
	}
	
	public void setFiberNetworkConstraints(FiberNetworkConstraints fiberNetworkConstraints) {
		this.fiberNetworkConstraints = fiberNetworkConstraints;
	}

	public void setPlanId(long planId) {
		this.planId = planId;
	}
	
	@Override
	public Set<LocationEntityType> getLocationEntityTypes() {
		return locationEntityTypes;
	}

	public void setLocationEntityTypes(Set<LocationEntityType> locationEntityTypes) {
		this.locationEntityTypes = locationEntityTypes;
	}

	public void setYear(int year) {
		this.year = year;
	}

	@Override
	public Set<Integer> getSelectedWireCenters() {
		return selectedWireCenters;
	}

	public void setSelectedWireCenters(Set<Integer> selectedWireCenters) {
		this.selectedWireCenters = selectedWireCenters;
	}
	
	
	
}
