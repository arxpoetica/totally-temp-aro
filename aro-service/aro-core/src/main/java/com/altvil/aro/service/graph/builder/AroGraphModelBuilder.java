package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.DAGModel;
import com.altvil.aro.util.function.Aggregator;

public interface AroGraphModelBuilder<E> extends Aggregator<E> {

	public DAGModel<Long> build()  ;
		
	
}
