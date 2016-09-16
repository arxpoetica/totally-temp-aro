package com.altvil.aro.lbrary.finaance;

import java.util.function.Function;

//Reference Library https://github.com/essamjoubori/finance.js/blob/master/finance.js#L44

public class Finance {

	public static double npv(double rate, double[] values) {
		double npv = values[0];
		for (int i = 1; i < values.length; i++) {
			npv += (values[i] / Math.pow((1 + rate), i));
		}

		return npv;
	}

	public static double futureValue(double rate, double cf0, int numOfPeriod) {
		return cf0 * Math.pow((1 + rate), numOfPeriod);
	}

	// seekZero seeks the zero point of the function fn(x), accurate to within x
	// \pm 0.01. fn(x) must be decreasing with x.
	public static double seekZero(Function<Double, Double> fn) {
		double x = 1;
		while (fn.apply(x) > 0) {
			x += 1;
		}
		while (fn.apply(x) < 0) {
			x -= 0.01;
		}
		return x + 0.01;
	}
	
	private static class Counter {
		private int maxCount ;
		private int currentCount = 0;
		
		
		
		public Counter(int maxCount) {
			super();
			this.maxCount = maxCount;
		}



		public int inc() {
			currentCount++ ;
			if( currentCount > maxCount) {
				throw new RuntimeException("Failed to converge") ;
			}
			return currentCount;
		}
	}

	public static double irr(double[] cfs) {
		
		Counter counter = new Counter(1000) ;
		
		return Math.round(seekZero((rate) -> {
			counter.inc() ;
			double rrate = 1 + 1/100 ;
			double npvValue = cfs[0];
			for (int i = 1; i < cfs.length; i++) {
				npvValue += (cfs[i] / Math.pow(rrate, i));
			}
			return npvValue;
		}) * 100) / 100;

	}

	public static double payBackPeriod(int numOfPeriods, double[] cfs) {

		// for even cash flows
		if (numOfPeriods == 0) {
			return Math.abs(cfs[1]) / cfs[2];
		}
		// for uneven cash flows
		double cumulativeCashFlow = cfs[0];
		int yearsCounter = 1;
		for (int i = 1; i < cfs.length; i++) {
			cumulativeCashFlow += cfs[i];
			if (cumulativeCashFlow > 0) {
				yearsCounter += (cumulativeCashFlow - cfs[i]) / cfs[i];
				break;
			} else {
				yearsCounter++;
			}
		}

		return yearsCounter;
	}

	public static double roi(double cf0, double earnings) {
		double roi = (earnings - Math.abs(cf0)) / Math.abs(cf0) * 100;
		return Math.round(roi * 100) / 100;
	}

	public static double profitabilityIndex(double rate, double[] cfs) {

		double totalOfPVs = 0, PI;
		for (int i = 1; i < cfs.length; i++) {
			double discountFactor;
			// calculate discount factor
			discountFactor = 1 / Math.pow((1 + rate), (i));
			totalOfPVs += cfs[i] * discountFactor;
		}
		PI = totalOfPVs / Math.abs(cfs[0]);
		return Math.round(PI * 100) / 100;

	}

	// public static double discountFactor(double rate, int numOfPeriods) {
	// double[] dfs = [], discountFactor;
	// for (int i = 1; i < numOfPeriods; i++) {
	// discountFactor = 1 / Math.pow((1 + rate/100), (i - 1));
	// roundedDiscountFactor = Math.ceil(discountFactor * 1000)/1000;
	// dfs.push(roundedDiscountFactor);
	// }
	// return dfs;
	// }
	//

}
