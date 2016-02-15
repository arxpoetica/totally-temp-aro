package com.altvil.aro.service.graph;

import org.jgrapht.DirectedGraph;

import com.altvil.aro.service.graph.node.GraphNode;

public interface DAGModel<T> extends GraphModel<T> {

	public GraphNode getRoot();

	public DAGModel<T> removeRootNode(GraphNode rootNode) ;
	
	public DirectedGraph<GraphNode, AroEdge<T>> getAsDirectedGraph();

}
