package com.altvil.aro.service.graph.model;

import java.io.Serializable;

@Deprecated
public class NetworkConfiguration implements Serializable {
	private static final long serialVersionUID = 1L;

	@Deprecated
	public enum Algorithm {
		WEIGHT_MINIMIZATION, NPV;
	};

	private final Algorithm algorithm;

	public NetworkConfiguration(Algorithm algorithm, double discountRate, int periods) {
		this.algorithm = algorithm;
		this.discountRate = discountRate;
		this.periods = periods;
	}

	public Algorithm getRoutePlanningAlgorithm() {
		return algorithm;
	}
	
	private final double discountRate;
	private final int periods;

	public double getDiscountRate() {
		return discountRate;
	}


	public int getPeriods() {
		return periods;
	}

}
