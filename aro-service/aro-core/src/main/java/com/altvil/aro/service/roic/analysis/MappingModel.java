package com.altvil.aro.service.roic.analysis;

import java.util.Set;

public interface MappingModel<K, V> {

	Set<K> getKeySet() ;
	V get(K key) ;
	
}
