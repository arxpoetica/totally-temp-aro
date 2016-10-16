package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.function.Function;
import java.util.function.Supplier;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.GraphPathConstraint;

public class SourceGraph<V, E> {

	private WeightedGraph<V, E> graph;
	private Function<WeightedGraph<V, E>, WeightedGraph<V, E>> f;
	private  boolean isConstraintSupported ;
	private GraphPathConstraint<V, E> constraint ;
	private Supplier<V> vertexSupplier;

	public SourceGraph(WeightedGraph<V, E> graph,
			Function<WeightedGraph<V, E>, WeightedGraph<V, E>> f,
			Supplier<V> vertexSupplier) {
		super();
		this.graph = graph;
		this.f = f;
		this.vertexSupplier = vertexSupplier;
	}

	public Supplier<V> getVertexSupplier() {
		return vertexSupplier;
	}

	public WeightedGraph<V, E> getMetricGraph() {
		return graph;
	}

	public WeightedGraph<V, E> createAnalysisGraph(WeightedGraph<V, E> g) {
		return f.apply(g);
	}

}
