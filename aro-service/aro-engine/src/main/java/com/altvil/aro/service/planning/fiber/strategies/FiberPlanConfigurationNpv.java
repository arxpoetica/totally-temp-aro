package com.altvil.aro.service.planning.fiber.strategies;

import com.altvil.aro.service.graph.alg.NpvClosestFirstIterator;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.plan.GlobalConstraint;
import com.altvil.aro.service.planning.NpvFiberPlan;

public class FiberPlanConfigurationNpv extends FiberPlanConfiguration implements NpvFiberPlan {
	private static final long serialVersionUID = 1L;
	final double			  discountRate;
	final int				  years;
	final double			  budget;

	public FiberPlanConfigurationNpv(NpvFiberPlan fiberPlan, GlobalConstraint globalConstraint) {
		super(fiberPlan, globalConstraint);
		this.budget = fiberPlan.getBudget();
		this.discountRate = fiberPlan.getDiscountRate();
		this.years = fiberPlan.getYears();
	}

	@Override
	public ClosestFirstSurfaceBuilder getClosestFirstSurfaceBuilder() {
		return new NpvClosestFirstIterator.Builder(getGlobalConstraint(), getDiscountRate(), getYears());
	}

	public double getBudget() {
		return budget;
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

}
