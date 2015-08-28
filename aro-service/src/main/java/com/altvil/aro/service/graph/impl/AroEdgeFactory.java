package com.altvil.aro.service.graph.impl;

import org.jgrapht.EdgeFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.node.GraphNode;

public class AroEdgeFactory implements EdgeFactory<GraphNode, AroEdge> {
	
	public static final AroEdgeFactory FACTORY = new AroEdgeFactory() ;
	
	@Override
	public AroEdge createEdge(GraphNode sourceVertex, GraphNode targetVertex) {
		return new AroEdge() ;
	}	
	
}
