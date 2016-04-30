package com.altvil.utils.calc;

import java.util.function.Function;

public class DoubleSummer implements Function<Double, Double> {
	private double total = 0;

	@Override
	public Double apply(Double t) {
		total += t;
		return total;
	}

}