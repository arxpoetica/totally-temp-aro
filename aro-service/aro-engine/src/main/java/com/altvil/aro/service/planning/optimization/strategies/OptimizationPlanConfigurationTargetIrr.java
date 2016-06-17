package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;
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
		}
		
		return false;
	}
}
