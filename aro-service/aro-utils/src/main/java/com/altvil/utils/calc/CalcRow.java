package com.altvil.utils.calc;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

public class CalcRow <C, T> {

	private Function<T, T> analyticFunction;

	private Map<C, T> map = new HashMap<>();
	private T total;

	public CalcRow(Function<T, T> analyticFunction) {
		super();
		this.analyticFunction = analyticFunction;
	}
	
	public CalcRow() {
		this((t) -> t) ;
	}

	public void add(C type, T val) {
		map.put(type, val);
		total = analyticFunction.apply(val);
	}

	public T getTotal() {
		return total;
	}

	public T getValue(C type) {
		return map.get(type);
	}

}
