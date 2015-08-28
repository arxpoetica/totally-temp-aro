package com.altvil.aro.service.graph;

import org.jgrapht.DirectedGraph;
import org.jgrapht.traverse.GraphIterator;

import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.util.function.Aggregator;

public interface GraphModel {

	public DirectedGraph<GraphNode, AroEdge> getGraph();

	public GraphNode getRoot();

	public GraphIterator<GraphNode, AroEdge> depthFirstItr();

	public <T extends Aggregator<GraphNode>> T depthFirstTraverse(T aggregator) throws GraphException;
}
