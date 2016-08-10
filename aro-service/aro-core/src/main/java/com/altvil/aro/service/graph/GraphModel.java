package com.altvil.aro.service.graph;

import java.util.Set;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphModel<T> {

	public WeightedGraph<GraphNode, AroEdge<T>> getGraph();
	
	public GraphNode getRoot() ;

	public Set<AroEdge<T>> getEdges();
	
	public Set<GraphNode> getVertices();

}
