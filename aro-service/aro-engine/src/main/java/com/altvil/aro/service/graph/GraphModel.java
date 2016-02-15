package com.altvil.aro.service.graph;

import org.jgrapht.DirectedGraph;
import org.jgrapht.traverse.GraphIterator;

import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphModel<T> {

	public DirectedGraph<GraphNode, AroEdge<T>> getGraph();

	public GraphNode getRoot();

	public GraphIterator<GraphNode, AroEdge<T>> depthFirstItr();

}
