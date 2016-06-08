package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;

import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.planning.CoverageOptimizationPlan;

public class OptimizationPlanConfigurationCoverage extends OptimizationPlanConfiguration implements CoverageOptimizationPlan {
	private static final long serialVersionUID = 1L;

	final double coverage;
	
	public double getCoverage() {
		return coverage;
	}

	@Override
	public
	double score(GeneratingNode node) {
		final double rawCoverage = node.getFiberCoverage().getRawCoverage();
		if (rawCoverage == 0) {
			return 0;
		}
		
		return node.getCapex() / rawCoverage; 
	}

	public OptimizationPlanConfigurationCoverage(CoverageOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.coverage = fiberPlan.getCoverage();
	}
	
	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return true;
	}

	public Function<AroEdge<GeoSegment>, Set<GraphNode>> getSelectedEdges(NetworkData networkData) {
		return (e) ->
		{
			GeoSegment value = e.getValue();
			
			if (value == null) {
				return null;
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
	
	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder() {
		return (p, g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
	

	private double totalDemand;

	@Override
	public void setNetworkData(NetworkData networkData) {
		super.setNetworkData(networkData);
		
		 totalDemand = networkData
				.getRoadLocations()
				.stream()
				.mapToDouble(
						a -> ((LocationEntity) a.getSource())
								.getLocationDemand().getDemand()).sum();
	}

	
	@Override
	public boolean isConstraintMet(NetworkAnalysis analysis) {
		// TODO Auto-generated method stub
				return false;
	}

	@Override
	public boolean satisfiesGlobalConstraint(OptimizedNetwork optimizedNetwork) {
		double ratio = optimizedNetwork.getAnalysisNode().getFiberCoverage()
				.getDemand()
				/ totalDemand;

		System.out.println(ratio);

		boolean predicate = !optimizedNetwork.isEmpty()
				&& (ratio >= getCoverage());
		return predicate;
	}
}
