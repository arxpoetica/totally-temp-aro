package com.altvil.aro.service.planning.optimization.strategies;

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
import com.altvil.aro.service.optimize.NetworkConstraint;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.aro.service.planning.NetworkConfiguration;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public abstract class OptimizationPlanConfiguration implements Cloneable, Serializable, OptimizationPlan, NetworkConfiguration, ScoringStrategy, NetworkConstraint {
	private static final long serialVersionUID = 1L;
	private long planId;
	private int year;
	private OptimizationType optimizationType;
	private NetworkData networkData;

	public OptimizationPlanConfiguration(OptimizationPlan optimizationPlan) {
		this.optimizationType = optimizationPlan.getOptimizationType();
		this.planId = optimizationPlan.getPlanId();
		this.year = optimizationPlan.getYear();
	}
	
	public abstract double score(GeneratingNode node) ;

	public long getPlanId() {
		return planId;
	}

	public int getYear() {
		return year;
	}

	public OptimizationType getOptimizationType() {
		return optimizationType;
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId) {
		try {
			OptimizationPlanConfiguration copy= (OptimizationPlanConfiguration) clone();
			copy.planId = dependentId;
			return (T)copy;
		} catch (CloneNotSupportedException e) {
			throw new RuntimeException(e);
		}
	}
	
	public NetworkData getNetworkData() {
		return networkData;
	}

	public void setNetworkData(NetworkData networkData) {
		this.networkData = networkData;
	}

	public abstract boolean satisfiesGlobalConstraint(OptimizedNetwork optimizedNetwork);


	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return true;
	}
	
	public boolean generatingNodeConstraint (GeneratingNode generatingNode) {
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
			
			return geoSegmentAssignments.isEmpty();
		};
	}

	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
}
