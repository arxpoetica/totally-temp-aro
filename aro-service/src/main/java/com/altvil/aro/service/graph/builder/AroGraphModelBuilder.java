package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.util.function.Aggregator;

public interface AroGraphModelBuilder<E> extends Aggregator<E> {

	public GraphModel<Long> build()  ;
		
	
}
