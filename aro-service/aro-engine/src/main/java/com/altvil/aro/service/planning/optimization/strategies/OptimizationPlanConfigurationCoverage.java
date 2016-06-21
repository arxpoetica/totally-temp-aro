package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
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

	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder(GlobalConstraint globalConstraint) {
		return (g, s) -> new ScalarClosestFirstSurfaceIterator<GraphNode, AroEdge<GeoSegment>>(g, s);
	}
	


	@Override
	public boolean isConstraintMet(NetworkAnalysis analysis) {
		// TODO Auto-generated method stub
				return false;
	}
	
	public boolean requiredNode(GeneratingNode generatingNode) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public Optional<OptimizedNetwork> selectOptimization(Collection<OptimizedNetwork> optimizedPlans) {
		// KJG Deliberately broken until we show a need to fix.
		double totalDemand = Double.NaN;
		for(OptimizedNetwork optimizedPlan : optimizedPlans) {
			final double demand = optimizedPlan.getAnalysisNode().getFiberCoverage()
					.getDemand();
			double ratio = demand / totalDemand;

			boolean predicate = ratio >= getCoverage();
			
			if (predicate) {
				return Optional.of(optimizedPlan);
			}
		}
		
		return Optional.empty();
	}
}
