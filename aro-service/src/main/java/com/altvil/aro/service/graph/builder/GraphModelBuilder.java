package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.dao.graph.GraphEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.util.function.Aggregator;

public interface GraphModelBuilder extends Aggregator<GraphEdge> {

	public GraphModel build()  ;
	
}
