package com.altvil.aro.service.roic.analysis.impl;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;
import com.altvil.aro.service.roic.analysis.calc.StreamAccessor;
import com.altvil.aro.service.roic.analysis.calc.StreamFunction;

public class HouseHoldsConnectedPercent extends AbstractStreamFunction {

	public static class Coefficents {
		private double intercept;

		private double time;

		private double r_penetration;
		private double hhGrowth;
		private double churnRate;
		private double churnDecrease;

		public double getIntercept() {
			return intercept;
		}

		public double getTime() {
			return time;
		}

		public double getRPenetration() {
			return r_penetration;
		}

		public double getHhGrowth() {
			return hhGrowth;
		}

		public double getChurnRate() {
			return churnRate;
		}

		public double getChurnDecrease() {
			return churnDecrease;
		}

	}

	private Coefficents coefficents;

	private StreamAccessor penetrationCurve;
	private StreamAccessor hhCounts;
	private StreamAccessor churnRate;
	private StreamAccessor churnDecrease;

	@Override
	public double calc(CalcContext ctx) {
		return coefficents.getIntercept()
				+ (ctx.getPeriod() * coefficents.getTime()
						+ penetrationCurve.getValue(ctx.getResultStream())
						* coefficents.getRPenetration()
						+ hhCounts.getValue(ctx.getResultStream())
						* coefficents.getHhGrowth()
						+ churnRate.getValue(ctx.getResultStream())
						* coefficents.getChurnRate() + churnDecrease
						.getValue(ctx.getResultStream())
						* coefficents.getChurnDecrease());
	}

}