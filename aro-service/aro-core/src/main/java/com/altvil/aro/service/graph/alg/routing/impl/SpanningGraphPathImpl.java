package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.jgrapht.Graph;
import org.jgrapht.Graphs;
import org.jgrapht.graph.GraphPathImpl;

import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public class SpanningGraphPathImpl<V, E> extends GraphPathImpl<V, E> implements
		SpanningGraphPath<V, E> {

	private List<E> reversedEdgeList;
	private List<E> edgeList;

	public SpanningGraphPathImpl(Graph<V, E> graph, V startVertex, V endVertex,
			List<E> reversedEdgeList, double weight) {
		super(graph, startVertex, endVertex, null, weight);
		this.reversedEdgeList = reversedEdgeList;
	}

	@Override
	public List<E> getEdgeList() {
		if (this.edgeList == null) {
			this.edgeList = new ArrayList<>(this.edgeList);
			Collections.reverse(this.edgeList);
		}

		return edgeList;
	}

	@Override
	public List<E> getReversedEdgeList() {
		return reversedEdgeList;
	}

	@Override
	public List<V> getReverseVertexList() {
		Graph<V, E> g = getGraph();
		List<V> list = new ArrayList<V>();
		V v = this.getEndVertex() ;
		list.add(v);
		for (E e : getReversedEdgeList()) {
			v = Graphs.getOppositeVertex(g, e, v);
			list.add(v);
		}
		return list;
	}

}
