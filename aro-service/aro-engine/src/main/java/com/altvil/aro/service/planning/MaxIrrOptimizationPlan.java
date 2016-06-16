package com.altvil.aro.service.planning;

public interface MaxIrrOptimizationPlan extends OptimizationPlan {
	/**
	 * The minimum acceptable IRR when selecting optimization plans.
	 */
	double getIrr();
	/**
	 * The budget (max capex) permitted when selecting optimization plans.
	 */
	double getBudget();
	/**
	 * The number of years over which the IRR calculations are performed.
	 */
	int getYears();
	}
