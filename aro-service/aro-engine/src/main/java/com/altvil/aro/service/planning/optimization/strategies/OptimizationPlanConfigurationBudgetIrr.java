package com.altvil.aro.service.planning.optimization.strategies;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.planning.IrrOptimizationPlan;

public class OptimizationPlanConfigurationBudgetIrr extends OptimizationPlanConfigurationIrr {
	private static final long serialVersionUID = 1L;
	private final Logger log = LoggerFactory.getLogger(OptimizationPlanConfigurationBudgetIrr.class);
	
	private final double minIrr;
	private final double budget;

	public OptimizationPlanConfigurationBudgetIrr(IrrOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.budget = fiberPlan.getBudget();
		this.minIrr = fiberPlan.getIrr();
	}

	protected boolean rejectPlan(double capex, double annualRevenue, double irr) {
		if (capex > budget) {
			log.debug("Capex ({}) > Budget ({})", capex, budget);
			return true;
		} else if (Double.isNaN(irr) || Double.isInfinite(irr)) {
			log.debug("IRR ({})", irr);
			return true;
		} else if (irr < minIrr) {
			log.debug("IRR ({}); < MinIRR({})", irr, minIrr);
			return true;
		}
		
		return false;
	}
}
