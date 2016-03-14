package com.altvil.aro.service.graph.alg;

import java.util.List;

import org.jgrapht.Graph;

public class GraphPathEdgeImpl<V, E> implements DAGPath<V, E> {

	private Graph<V, E> graph;

	private List<PathEdge<V,E>> edgeList;

	private V startVertex;

	private V endVertex;

	private double weight;

	public GraphPathEdgeImpl(Graph<V, E> graph, V startVertex, V endVertex,
			List<PathEdge<V,E>> edgeList, double weight) {
		this.graph = graph;
		this.startVertex = startVertex;
		this.endVertex = endVertex;
		this.edgeList = edgeList;
		this.weight = weight;
	}

	// implement GraphPath
	@Override
	public Graph<V, E> getGraph() {
		return graph;
	}

	// implement GraphPath
	@Override
	public V getStartVertex() {
		return startVertex;
	}

	// implement GraphPath
	@Override
	public V getEndVertex() {
		return endVertex;
	}
	

	@Override
	public List<PathEdge<V, E>> getPathEdges() {
		return edgeList;
	}


	// implement GraphPath
	@Override
	public double getWeight() {
		return weight;
	}

	// override Object
	@Override
	public String toString() {
		return edgeList.toString();
	}
}

// End GraphPathImpl.java
