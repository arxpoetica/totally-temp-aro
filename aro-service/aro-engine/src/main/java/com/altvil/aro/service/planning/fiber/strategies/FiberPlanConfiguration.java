package com.altvil.aro.service.planning.fiber.strategies;

import java.io.Serializable;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;

import com.altvil.aro.service.entity.LocationEntityType;
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
import com.altvil.enumerations.FiberPlanAlgorithm;

public class FiberPlanConfiguration implements Cloneable, Serializable, FiberPlan, NetworkConfiguration {
	private static final long serialVersionUID = 1L;
	private final FiberPlan fiberPlan;
	private long planId;
	

	public FiberPlanConfiguration(FiberPlan fiberPlan) {
		this.fiberPlan= fiberPlan;
		this.planId = fiberPlan.getPlanId();
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

	public Function<AroEdge<GeoSegment>, Set<GraphNode>> getSelectedEdges(NetworkData networkData) {
		return (e) ->
		{
			GeoSegment value = e.getValue();
			
			if (value == null) {
				return Collections.emptySet();
			}
			
			Collection<GraphEdgeAssignment> geoSegmentAssignments = value.getGeoSegmentAssignments();
			
			if (geoSegmentAssignments.isEmpty()) {
				return Collections.emptySet();
			}
			
			// There may be multiple marked locations on this edge so it may be necessary to return both vertices of this edge.
			Set<GraphNode> selectedNodes = new HashSet<>();
			for (GraphEdgeAssignment assignment: geoSegmentAssignments) {
				if (assignment.getPinnedLocation().isAtStartVertex()) {
					selectedNodes.add(e.getSourceNode());
				} else {
					selectedNodes.add(e.getTargetNode());
				}
			}
			
			return selectedNodes;
		};
	}

	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (p, g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
}