package com.altvil.aro.service.planning.fiber.strategies;

import java.io.Serializable;
import java.util.Set;

import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
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
	

	public FiberPlanConfiguration(FiberPlan fiberPlan, GlobalConstraint globalConstraint) {
		this.fiberPlan= fiberPlan;
		this.globalConstraint = globalConstraint;
		this.planId = fiberPlan.getPlanId();
	}		
	
	public GlobalConstraint getGlobalConstraint() {
		return globalConstraint;
	}
	

	@Override
	public Set<Integer> getSelectedWireCenters() {
		return fiberPlan.getSelectedWireCenters() ;
	}


	@Override
	public Set<LocationEntityType> getLocationEntityTypes() {
		return fiberPlan.getLocationEntityTypes() ;
	}


	@Override
	protected Object clone() throws CloneNotSupportedException {
		// TODO Auto-generated method stub
		return super.clone();
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
	public <T> T dependentPlan(long dependentId) {
		try {
			FiberPlanConfiguration copy = (FiberPlanConfiguration) clone();
			copy.planId = dependentId;
			return (T) copy;
		} catch (CloneNotSupportedException e) {
			throw new RuntimeException(e);
		}
	}

	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return this.getSelectedWireCenters().isEmpty() ;
	}

	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
}
