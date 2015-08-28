package com.altvil.aro.util.function;


@FunctionalInterface
public interface Aggregator<T> {
	
	public Aggregator<T> apply(T value) ;
	
}
