package com.altvil.aro.service.roic.analysis.builder;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;

public interface Aggregator<K, M extends RoicAnalysis> {

	Aggregator<K, M> select(K type) ;
	Aggregator<K, M> add(M model) ;
	Aggregator<K, M> addAll(Collection<M> model) ;
	M sum() ;
	
}
