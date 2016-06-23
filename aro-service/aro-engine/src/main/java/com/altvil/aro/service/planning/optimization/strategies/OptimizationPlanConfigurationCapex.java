package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Iterator;
import java.util.Optional;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.ScalarClosestFirstSurfaceIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.OptimizationPlan;

public class OptimizationPlanConfigurationCapex extends OptimizationPlanConfiguration implements OptimizationPlan {
	private static final long serialVersionUID = 1L;

	@Override
	public
	double score(GeneratingNode node) {
		return 1;
	}

	public OptimizationPlanConfigurationCapex(OptimizationPlan fiberPlan) {
		super(fiberPlan);
	}
	
	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	public boolean isFilteringRoadLocationsBySelection() {
		return true;
	}

	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder(GlobalConstraint globalConstraint) {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
	


	@Override
	public boolean isConstraintMet(NetworkAnalysis analysis) {
				return true;
	}
	
	public boolean requiredNode(GeneratingNode generatingNode) {
		return false;
	}

	@Override
	public Optional<OptimizedNetwork> selectOptimization(Collection<OptimizedNetwork> optimizedPlans) {
		final Iterator<OptimizedNetwork> itr = optimizedPlans.iterator();
		return itr.hasNext() ? Optional.of(itr.next()) : Optional.empty();
	}
}
