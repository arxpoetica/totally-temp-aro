package com.altvil.aro.service.planning.fiber.strategies;

import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.NetworkConfiguration;
import com.altvil.enumerations.FiberPlanAlgorithm;

public class FiberPlanConfiguration implements Cloneable, Serializable, FiberPlan, NetworkConfiguration {
	private static final long serialVersionUID = 1L;
	private final FiberPlan fiberPlan;
	private final GlobalConstraint globalConstraint;
	private long planId;
	private long masterPlanId = -1;
	private Set<Integer> wireCenterIds;

	public FiberPlanConfiguration(FiberPlan fiberPlan, GlobalConstraint globalConstraint) {
		this.fiberPlan= fiberPlan;
		this.globalConstraint = globalConstraint;
		this.planId = fiberPlan.getPlanId();
		this.wireCenterIds = fiberPlan.getSelectedWireCenters();
	}		
	
	public GlobalConstraint getGlobalConstraint() {
		return globalConstraint;
	}
	

	@Override
	public Set<Integer> getSelectedWireCenters() {
		return wireCenterIds;
	}


	public long getMasterPlanId() {
		return masterPlanId;
	}

	@Override
	public Set<LocationEntityType> getLocationEntityTypes() {
		return fiberPlan.getLocationEntityTypes() ;
	}


	public FiberPlanAlgorithm getAlgorithm() {
		return fiberPlan.getAlgorithm();
	}

	public long getPlanId() {
		return planId;
	}

	public int getYear() {
		return fiberPlan.getYear();
	}
	
	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return fiberPlan.getFiberNetworkConstraints();
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId, int wireCenterId) {
		try {
			FiberPlanConfiguration copy = (FiberPlanConfiguration) clone();
			copy.planId = dependentId;
			copy.masterPlanId = this.planId;
			Set<Integer> dependentWireCenters = new HashSet<>();
			dependentWireCenters.add(wireCenterId);
			copy.wireCenterIds = dependentWireCenters;
			return (T) copy;
		} catch (CloneNotSupportedException e) {
			throw new RuntimeException(e);
		}
	}

	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return true;
	}

	public ClosestFirstSurfaceBuilder getClosestFirstSurfaceBuilder() {
		return ScalarClosestFirstSurfaceIterator.BUILDER;
	}
}
