package com.altvil.aro.service.dao.graph.impl;

import org.jgrapht.DirectedGraph;
import org.jgrapht.event.VertexTraversalEvent;
import org.jgrapht.traverse.DepthFirstIterator;
import org.jgrapht.traverse.GraphIterator;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.impl.DefaultGraphTraversalListener;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.util.function.Aggregator;

public class GraphModelImpl implements GraphModel {

	private DirectedGraph<GraphNode, AroEdge> graph;
	private GraphNode root;

	public GraphModelImpl(DirectedGraph<GraphNode, AroEdge> graph,
			GraphNode root) {
		super();
		this.graph = graph;
		this.root = root;
	}

	@Override
	public DirectedGraph<GraphNode, AroEdge> getGraph() {
		return graph;
	}

	@Override
	public GraphNode getRoot() {
		return root;
	}

	public <T extends Aggregator<GraphNode>> T depthFirstTraverse(T aggregator) {
		GraphIterator<GraphNode, AroEdge> itr = depthFirstItr();
		itr.addTraversalListener(new DefaultGraphTraversalListener<GraphNode, AroEdge>() {
			@Override
			public void vertexFinished(VertexTraversalEvent<GraphNode> e) {
				aggregator.apply(e.getVertex());
			}
		});

		while (itr.hasNext()) {
			itr.next();
		}

		return aggregator;
	}

	@Override
	public GraphIterator<GraphNode, AroEdge> depthFirstItr() {
		return new DepthFirstIterator<GraphNode, AroEdge>(graph, root);
	}

}
