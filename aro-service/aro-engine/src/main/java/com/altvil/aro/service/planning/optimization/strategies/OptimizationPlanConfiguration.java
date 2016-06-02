package com.altvil.aro.service.planning.optimization.strategies;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;

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
import com.altvil.aro.service.plan.FiberNetworkConstraints;
import com.altvil.aro.service.planning.NetworkConfiguration;
import com.altvil.aro.service.planning.OptimizationPlan;
import com.altvil.enumerations.OptimizationType;

public abstract class OptimizationPlanConfiguration
		implements Cloneable, Serializable, OptimizationPlan, NetworkConfiguration, ScoringStrategy, NetworkConstraint {
	private static final long	   serialVersionUID	= 1L;
	private NetworkData			   networkData;
	private final OptimizationPlan optimizationPlan;
	private OptimizationType	   optimizationType;
	private long				   planId;

	public OptimizationPlanConfiguration(OptimizationPlan optimizationPlan) {
		this.optimizationPlan = optimizationPlan;
		this.planId = optimizationPlan.getPlanId();
	}

	@SuppressWarnings("unchecked")
	@Override
	public <T> T dependentPlan(long dependentId) {
		try {
			OptimizationPlanConfiguration copy = (OptimizationPlanConfiguration) clone();
			copy.planId = dependentId;
			return (T) copy;
		} catch (CloneNotSupportedException e) {
			throw new RuntimeException(e);
		}
	}

	public boolean generatingNodeConstraint(GeneratingNode generatingNode) {
		return true;
	}

	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}

	public FiberNetworkConstraints getFiberNetworkConstraints() {
		return optimizationPlan.getFiberNetworkConstraints();
	}

	public NetworkData getNetworkData() {
		return networkData;
	}

	public OptimizationType getOptimizationType() {
		return optimizationType;
	}

	public long getPlanId() {
		return planId;
	}

	public Function<AroEdge<GeoSegment>, Set<GraphNode>> getSelectedEdges(NetworkData networkData) {
		return (e) -> {
			GeoSegment value = e.getValue();

			if (value == null) {
				return Collections.emptySet();
			}

			Collection<GraphEdgeAssignment> geoSegmentAssignments = value.getGeoSegmentAssignments();

			if (geoSegmentAssignments.isEmpty()) {
				return Collections.emptySet();
			}

			// There may be multiple marked locations on this edge so it may be
			// necessary to return both vertices of this edge.
			Set<GraphNode> selectedNodes = new HashSet<>();
			for (GraphEdgeAssignment assignment : geoSegmentAssignments) {
				if (assignment.getPinnedLocation().isAtStartVertex()) {
					selectedNodes.add(e.getSourceNode());
				} else {
					selectedNodes.add(e.getTargetNode());
				}
			}

			return selectedNodes;
		};
	}

	public int getYear() {
		return optimizationPlan.getYear();
	}

	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return true;
	}

	public abstract boolean satisfiesGlobalConstraint(OptimizedNetwork optimizedNetwork);

	public abstract double score(GeneratingNode node);

	public void setNetworkData(NetworkData networkData) {
		this.networkData = networkData;
	}
}
