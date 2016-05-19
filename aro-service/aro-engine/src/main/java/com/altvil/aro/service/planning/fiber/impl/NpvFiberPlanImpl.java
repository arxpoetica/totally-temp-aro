package com.altvil.aro.service.planning.fiber.impl;

import com.altvil.aro.service.planning.NpvFiberPlan;
import com.altvil.aro.service.planning.fiber.impl.AbstractFiberPlan;
import com.altvil.enumerations.FiberPlanAlgorithm;

public class NpvFiberPlanImpl extends AbstractFiberPlan implements NpvFiberPlan {
	private double discountRate = Double.NaN;
	private int years = -1;

	protected NpvFiberPlanImpl() {
		super(FiberPlanAlgorithm.NPV);
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.planning.fiber.NpvProperties#getDiscountRate()
	 */
	@Override
	public double getDiscountRate() {
		return discountRate;
	}

	/* (non-Javadoc)
	 * @see com.altvil.aro.service.planning.fiber.NpvProperties#getYears()
	 */
	@Override
	public int getYears() {
		return years;
	}

	public void setDiscountRate(double discountRate) {
		this.discountRate = discountRate;
	}

	public void setYears(int years) {
		this.years = years;
	}
}
