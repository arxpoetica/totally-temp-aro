package com.altvil.aro.service.graph.builder;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphModelBuilder<E extends AroEdge> {

	public E add(GraphNode src, GraphNode target, double weight) ;
	public void setRoot(GraphNode root) ;
	public GraphModel<E> build() ;
	
}
