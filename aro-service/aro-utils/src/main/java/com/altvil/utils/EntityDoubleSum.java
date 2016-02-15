package com.altvil.utils;

import java.util.HashMap;
import java.util.Map;

public class EntityDoubleSum<T> {
	
	private Map<T, DoubleCounter> map = new HashMap<>() ;
	
	public void add(T entity, double value) {
		DoubleCounter counter = map.get(entity) ;
		if( counter == null ) {
			map.put(entity, counter = new DoubleCounter()) ;
		}
		
		counter.add(value) ;
		
	}
	
	public Map<T, Double> getTotals() {
		Map<T, Double> result = new HashMap<>(map.size()) ;
		
		map.entrySet().forEach(e -> {
			result.put(e.getKey(), e.getValue().getSum()) ;
		});
		
		return result ;
	}

}
