package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Optional;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.NpvOptimizationPlan;

public class OptimizationPlanConfigurationNpv extends OptimizationPlanConfiguration implements NpvOptimizationPlan {
	private static final long serialVersionUID = 1L;

	private final double	  budget;
	private final double	  discountRate;
	private final int		  years;

	public OptimizationPlanConfigurationNpv(NpvOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.budget = fiberPlan.getBudget();
		this.discountRate = fiberPlan.getDiscountRate();
		this.years = fiberPlan.getYears();
	}

	public double getBudget() {
		return budget;
	}

	@Override
	public double score(GeneratingNode node) {
		double npv = -node.getCapex();

		// if the cost of this plan does NOT exceed the budget then include the
		// revenue in the NPV calculation otherwise return NPV with no revenue
		// to make this plan highly undesirable.
		// NOTE: Do NOT return a constant value when the budget is exceeded as
		// the plan's npv must get worse each time it is extended.
		if (node.getCapex() < budget) {
			// NOTE: Assumes fixed revenue for every year INCLUDING THE FIRST
			// YEAR.
			double revenue = 12 * node.getFiberCoverage().getMonthlyRevenueImpact();
			for (int t = 1; t <= years; t++) {
				npv += revenue / Math.pow(1 + discountRate, t);
			}
		}

		return npv;
	}

	@Override
	public ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> getClosestFirstSurfaceBuilder(GlobalConstraint globalConstraint) {
		return (g, s) -> new NpvClosestFirstIterator<GraphNode, AroEdge<GeoSegment>>(globalConstraint, getDiscountRate(), getYears(), g, s);
	}

	public double getDiscountRate() {
		return discountRate;
	}

	public int getYears() {
		return years;
	}

	@Override
	public boolean isFilteringRoadLocationDemandsBySelection() {
		return false;
	}

	@Override
	public boolean isFilteringRoadLocationsBySelection() {
		return false;
	}

	@Override
	public boolean isConstraintMet(NetworkAnalysis analysis) {
		// TODO Auto-generated method stub
		return false;
	}

	@Override
	public Optional<OptimizedNetwork> selectOptimization(Collection<OptimizedNetwork> optimizedPlans) {
		if (optimizedPlans.isEmpty()) {
			return Optional.empty();
		}
		
		return Optional.of(optimizedPlans.iterator().next());
	}
}
