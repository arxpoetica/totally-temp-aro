package com.altvil.aro.service.graph.model;

import com.altvil.aro.service.graph.node.GraphNode;

public interface AroEdgeDefinition<T> {

	public GraphNode getSource() ;
	public GraphNode getTarget() ;
	public double getWeight() ;
	public T getValue() ;
	
}
