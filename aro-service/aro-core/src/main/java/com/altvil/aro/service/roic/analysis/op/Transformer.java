package com.altvil.aro.service.roic.analysis.op;

import java.util.Collection;

import com.altvil.aro.service.roic.analysis.model.RoicAnalysis;

public interface Transformer<M extends RoicAnalysis> {
	
	Transformer<M> add(M model) ;
	Transformer<M> addAll(Collection<M> models) ;
	M apply() ;
	

}
