package com.altvil.aro.service.graph.impl;

import java.util.Collection;
import java.util.Set;

import org.jgrapht.EdgeFactory;
import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.model.AroEdgeDefinition;
import com.altvil.aro.service.graph.node.GraphNode;

public class GraphModelImpl<T> implements GraphModel<T> {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(GraphModelImpl.class.getName());

	private WeightedGraph<GraphNode, AroEdge<T>> graph;
	private EdgeFactory<GraphNode, AroEdge<T>> edgeFactory;
	private GraphNode root;

	public GraphModelImpl(WeightedGraph<GraphNode, AroEdge<T>> graph,
			EdgeFactory<GraphNode, AroEdge<T>> edgeFactory, GraphNode root) {
		super();
		this.graph = graph;
		this.edgeFactory = edgeFactory;
		this.root = root;
	}

	@Override
	public GraphNode getRoot() {
		return root;
	}

	@Override
	public WeightedGraph<GraphNode, AroEdge<T>> getGraph() {
		return graph;
	}

	@Override
	public Set<AroEdge<T>> getEdges() {
		return graph.edgeSet();
	}

	@Override
	public Set<GraphNode> getVertices() {
		return graph.vertexSet();
	}

	public void replace(AroEdge<T> orginal,
			Collection<AroEdgeDefinition<T>> updatedEdges) {
		graph.removeEdge(orginal);
		updatedEdges.forEach(e -> {
			add(e.getSource(), e.getTarget(), e.getValue(), e.getWeight());
		});

	}

	protected AroEdge<T> add(GraphNode src, GraphNode target, T value,
			double weight) {
		graph.addVertex(src);
		graph.addVertex(target);

		AroEdge<T> edge = edgeFactory.createEdge(src, target);
		graph.addEdge(src, target, edge);
		graph.setEdgeWeight(edge, weight);
		edge.setValue(value);

		return edge;
	}

}
