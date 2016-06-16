package com.altvil.aro.service.planning.optimization.strategies;

import java.util.Collection;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.planning.MaxIrrOptimizationPlan;

public class OptimizationPlanConfigurationTargetIrr extends OptimizationPlanConfigurationMaxIrr {
	private static final long serialVersionUID = 1L;
	private final Logger log = LoggerFactory.getLogger(OptimizationPlanConfigurationTargetIrr.class);
	
	private final double irr;

	public OptimizationPlanConfigurationTargetIrr(MaxIrrOptimizationPlan fiberPlan) {
		super(fiberPlan);
		this.irr = fiberPlan.getIrr();
	}

	@Override
	public Optional<OptimizedNetwork> selectOptimization(Collection<OptimizedNetwork> optimizedPlans) {
		for (OptimizedNetwork optimizedPlan : optimizedPlans) {
			AnalysisNode analysisNode = optimizedPlan.getAnalysisNode();
			double capex = analysisNode.getCapex();
			
			if (capex > getBudget()) {
				log.debug("Capex ({}) > Budget ({})", capex, getBudget());
				continue;
			}
			
			double annualRevenue = 12 * analysisNode.getFiberCoverage().getMonthlyRevenueImpact();

			double planIrr = calculateIrr(capex, annualRevenue);
			
			log.debug("Capex = {}, Annual Revenue = {}, IRR = {}", capex, annualRevenue, planIrr);

			if (planIrr > irr) {		
				log.debug("Selected plan w/IRR = {}", planIrr);
				return Optional.of(optimizedPlan);
			}
		}
		
		return Optional.empty();
	}
}
