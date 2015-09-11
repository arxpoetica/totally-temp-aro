package com.altvil.aro.service.graph;

import org.jgrapht.DirectedGraph;
import org.jgrapht.traverse.GraphIterator;

import com.altvil.aro.service.graph.node.GraphNode;

public interface GraphModel<E extends AroEdge> {

	public DirectedGraph<GraphNode, E> getGraph();

	public GraphNode getRoot();

	public GraphIterator<GraphNode, E> depthFirstItr();

}
