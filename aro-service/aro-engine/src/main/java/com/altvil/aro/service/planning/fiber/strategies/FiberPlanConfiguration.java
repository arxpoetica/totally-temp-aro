package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.enumerations.FiberPlanAlgorithm;

import java.io.Serializable;
import java.util.Collection;
import java.util.function.Predicate;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.NetworkConfiguration;

public class FiberPlanConfiguration implements Cloneable, Serializable, FiberPlan, NetworkConfiguration {
	private static final long serialVersionUID = 1L;
	private final FiberPlan fiberPlan;
	private long planId;

	public FiberPlanConfiguration(FiberPlan fiberPlan) {
		this.fiberPlan= fiberPlan;
		this.planId = fiberPlan.getPlanId();
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
		return true;
	}

	public Predicate<AroEdge<GeoSegment>> getSelectedEdges(NetworkData networkData) {
		return (e) ->
		{
			GeoSegment value = e.getValue();
			
			if (value == null) {
				return false;
			}
			
			Collection<GraphEdgeAssignment> geoSegmentAssignments = value.getGeoSegmentAssignments();
			
			return !geoSegmentAssignments.isEmpty();
		};
	}

	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
}
