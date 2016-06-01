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
import com.altvil.aro.service.planning.FiberPlan;
import com.altvil.aro.service.planning.NetworkConfiguration;

public class FiberPlanConfiguration implements Cloneable, Serializable, FiberPlan, NetworkConfiguration {
	private static final long serialVersionUID = 1L;
	private final FiberPlanAlgorithm algorithm;
	private long planId;
	private final int year;

	public FiberPlanConfiguration(FiberPlan fiberPlan) {
		this.algorithm = fiberPlan.getAlgorithm();
		this.planId = fiberPlan.getPlanId();
		this.year = fiberPlan.getYear();
	}

	public FiberPlanAlgorithm getAlgorithm() {
		return algorithm;
	}

	public long getPlanId() {
		return planId;
	}

	public int getYear() {
		return year;
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId) {
		try {
			FiberPlanConfiguration copy= (FiberPlanConfiguration) clone();
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
