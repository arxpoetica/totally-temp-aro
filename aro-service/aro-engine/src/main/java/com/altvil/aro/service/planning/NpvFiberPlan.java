package com.altvil.aro.service.planning;

import com.altvil.aro.service.planning.FiberPlan;

public interface NpvFiberPlan extends FiberPlan {
	double getDiscountRate();

	int getYears();
}
