package com.altvil.aro.service.network.impl;

import com.altvil.annotation.Strategy;
import com.altvil.aro.service.graph.model.NetworkStrategy;
import com.altvil.aro.service.network.NetworkStrategyFactory;
import com.altvil.aro.service.network.NetworkStrategyRequest;

@Strategy(type=NetworkStrategyFactory.class, name="NPV")
public class NpvNetworkStrategyFactory implements NetworkStrategyFactory {
	@Override
	public NetworkStrategy getNetworkStrategy(NetworkStrategyRequest request) {
		double discountRate = (Double) request.getProperties().get("discountRate");
		int years = (Integer) request.getProperties().get("years");
		
		return new NpvNetworkStrategy(discountRate, years);
	}
	
	public static class NpvNetworkStrategy implements NetworkStrategy {
		private final double discountRate;
		private final int years;
		
		public NpvNetworkStrategy(double discountRate, int years) {
			this.discountRate = discountRate;
			this.years = years;
		}

		public double getDiscountRate() {
			return discountRate;
		}

		public int getYears() {
			return years;
		}
	}

}
