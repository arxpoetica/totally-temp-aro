package com.altvil.aro.service.roic.analysis.op;

import java.util.function.Function;

import com.altvil.aro.service.roic.analysis.calc.CalcContext;

public class MonthlyHouseHoldsConnectedPercent extends AbstractStreamFunction {

	public static class Params {

		public static Params COEF = new Params(0.132, 0.005, 4.494, 1.973,
				5.599, 314.924);

		private double intercept = 0.132;

		private double timeCoef;
		
		private double rCoef;
		private double hhGrowth ;
		private double churnRateCoef;
		private double churnDecreaseCoef;

		public Params(double intercept, double time, double rCoef,
				double hhGrowth, double churnRateCoef, double churnDecreaseCoef) {
			super();
			this.intercept = intercept;
			this.timeCoef = time;

			this.rCoef = rCoef;
			this.hhGrowth = hhGrowth;
			this.churnRateCoef = churnRateCoef;
			this.churnDecreaseCoef = churnDecreaseCoef;
		}

		public Params(double rCoef, double hhGrowth, double churnRateCoef,
				double churnDecreaseCoef) {
			this(0.0, 0.0, rCoef, hhGrowth, churnRateCoef, churnDecreaseCoef);
		}

		public Function<Double, Double> bindParams(Params model) {

			double coef = (rCoef * model.rCoef) + (hhGrowth * model.hhGrowth)
					+ (churnRateCoef + model.churnRateCoef)
					+ (churnDecreaseCoef + model.churnDecreaseCoef) + intercept;

			return (time) -> coef + (timeCoef * time);

		}

		public double getRCoef() {
			return rCoef;
		}

		public void setrCoef(double rCoef) {
			this.rCoef = rCoef;
		}

		public double getHhGrowth() {
			return hhGrowth;
		}

		public void setHhGrowth(double hhGrowth) {
			this.hhGrowth = hhGrowth;
		}

		public double getChurnRateCoef() {
			return churnRateCoef;
		}

		public void setChurnRateCoef(double churnRateCoef) {
			this.churnRateCoef = churnRateCoef;
		}

		public double getChurnDecreaseCoef() {
			return churnDecreaseCoef;
		}

		public void setChurnDecreaseCoef(double churnDecreaseCoef) {
			this.churnDecreaseCoef = churnDecreaseCoef;
		}
	}

	private Function<Double, Double> f;
	
	public MonthlyHouseHoldsConnectedPercent(Params modelParams) {
		f = Params.COEF.bindParams(modelParams) ;
	}
	
	@Override
	public double calc(CalcContext ctx) {
		return f.apply((double) ctx.getPeriod());
	}

}