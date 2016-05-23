package com.altvil.aro.service.planning;

import com.altvil.aro.service.planning.FiberPlan;

public interface NpvFiberPlan extends FiberPlan {
	/**
	 * An upper limit on the amount that may be spent to implement a plan.
	 * Defaults to positive infinity.
	 * @return
	 */
	double getBudget();
	double getDiscountRate();

	/**
	 * The number of years over which to calculate the NPV of the plan.
	 * @return
	 */
	int getYears();
}
