package com.altvil.aro.service.graph.impl;

import org.jgrapht.EdgeFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.node.GraphNode;

public class AroEdgeFactory<T> implements EdgeFactory<GraphNode, AroEdge<T>> {
	
	
	@Override
	public AroEdge<T> createEdge(GraphNode sourceVertex, GraphNode targetVertex) {
		return new AroEdge<T>() ;
	}	
	
}
