package com.altvil.aro.service.optimization.strategy;


public class StrategyUtils {
	

	public static double calculateIrr(double capex, double annualRevenue, int years) {
		double[] rates = {-.1, .1};
		double[] npv = {npv(capex, annualRevenue, rates[0], years), npv(capex, annualRevenue, rates[1], years)};
		int oldest = 0;
		int kjg = 50;
		
		do {
			double deltaRate = rates[0] - rates[1];
			double deltaNpv = npv[0] - npv[1];

			double nextRate = rates[1] - (npv[1] * deltaRate / deltaNpv);
			double nextNpv = npv(capex, annualRevenue, nextRate, years);
			
			if (Math.abs(rates[0] - rates[1]) < 0.001 || Double.isNaN(rates[0])) {
				break;
			}
			
			rates[oldest] = nextRate;
			npv[oldest] = nextNpv;
			oldest = 1 - oldest;
			if (kjg-- < 0) {
				kjg = 50;
				break;
			}
		} while (true);
		
		return rates[0];		
	}
	
	public static double npv(double capex, double revenue, double discountRate, int years) {
		double npv = -capex;

		for (int t = 1; t < years; t++) {
			npv += revenue / Math.pow(1 + discountRate, t);
		}
		
		return npv;
	}
	

}
