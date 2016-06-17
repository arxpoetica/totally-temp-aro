package com.altvil.aro.service.planning.optimization.strategies;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.planning.IrrOptimizationPlan;

public class OptimizationPlanConfigurationTargetIrr extends OptimizationPlanConfigurationIrr {
	private static final long serialVersionUID = 1L;
	private final Logger log = LoggerFactory.getLogger(OptimizationPlanConfigurationTargetIrr.class);
	
	private final double minIrr;

	public OptimizationPlanConfigurationTargetIrr(IrrOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.minIrr = fiberPlan.getIrr();
	}

	@Override
	protected boolean chooseIrr(double irr) {
		return true;
	}

	@Override
	protected boolean rejectPlan(double capex, double annualRevenue, double irr) {
		if (irr < minIrr) {
			log.debug("IRR ({}); < MinIRR({})", irr, minIrr);
			return true;
		} else if (Double.isNaN(irr)) {
			log.debug("IRR ({})", irr);
			return true;
		}
		
		return false;
	}
}
