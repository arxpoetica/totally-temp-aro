package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphModelBuilder<T> {

	public AroEdge<T> add(GraphNode src, GraphNode target, T value,  double weight) ;
	public void setRoot(GraphNode root) ;
	public GraphModel<T> build() ;
	
}
