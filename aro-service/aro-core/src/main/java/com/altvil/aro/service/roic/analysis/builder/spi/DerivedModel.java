package com.altvil.aro.service.roic.analysis.builder.spi;

import java.util.Collection;
import java.util.Set;

public interface DerivedModel<K, M> {

	Set<K> keySet() ;
	Collection<M> getSubComponents(K key) ;
	
}
