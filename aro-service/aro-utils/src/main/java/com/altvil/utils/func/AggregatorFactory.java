package com.altvil.utils.func;

import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;

public class AggregatorFactory {
	
private Map<Class<?>, Supplier<Aggregator<?>>> map = new HashMap<>() ;
	
	public static final AggregatorFactory FACTORY = new AggregatorFactory() ;
	
	private AggregatorFactory() {
		init() ;
	}
	
	private void init() {
		map.put(Double.class, () -> new DoubleSummer()) ;
		map.put(Long.class, () -> new LongSummer()) ;
	}
	
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public <T>  Supplier<Aggregator<T>> getAggregator(Class<T> clz) {
		return (Supplier) map.get(clz) ;
	}
	
	public static class DoubleSummer implements Aggregator<Double> {
		private double value;

		public void add(Double value) {
			this.value += value;
		}

		@Override
		public Double apply() {
			return value;
		}

	}
	
	public class LongSummer implements Aggregator<Long> {
		private long value;

		public void add(Long value) {
			this.value += value;
		}

		@Override
		public Long apply() {
			return value ;
		}		

	}


}
