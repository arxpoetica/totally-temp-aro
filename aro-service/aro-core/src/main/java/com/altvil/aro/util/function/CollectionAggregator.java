package com.altvil.aro.util.function;

import java.util.ArrayList;
import java.util.List;

public class CollectionAggregator<T> implements Aggregator<T> {

	private List<T> result;

	public CollectionAggregator(int defaultSize) {
		result = new ArrayList<T>(defaultSize);
	}

	public CollectionAggregator() {
		this(500);
	}

	@Override
	public Aggregator<T> apply(T value) {
		result.add(value) ;
		return this;
	}

	public List<T> result() {
		return result;
	}

}
