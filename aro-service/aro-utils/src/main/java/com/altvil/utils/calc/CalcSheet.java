package com.altvil.utils.calc;

import java.util.Collection;
import java.util.function.Function;

public class CalcSheet<C> {

	private Collection<C> columnIds;

	public CalcSheet(Collection<C> columnIds) {
		super();
		this.columnIds = columnIds;
	}

	public CalcRow<C, Double> calcDouble(Function<C, Double> f) {
		return calc(f, new DoubleSummer());
	}

	public CalcRow<C, Double> calcDouble(Function<C, Double> f,
			Function<Double, Double> analyticFunction) {
		return calc(f, analyticFunction);
	}

	public <T> CalcRow<C, T> calc(Function<C, T> f,
			Function<T, T> analyticFunction) {

		CalcRow<C, T> row = new CalcRow<C, T>(analyticFunction);

		for (C nt : columnIds) {
			row.add(nt, f.apply(nt));
		}

		return row;
	}

}
