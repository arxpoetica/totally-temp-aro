package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.function.Supplier;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.routing.VirtualRoot;

public class SourceGraph<V, E> {

	private WeightedGraph<V, E> metricGraph;
	private WeightedGraph<V, E> analysisGraph;
	private Supplier<V> supplierVertex;

	public SourceGraph(WeightedGraph<V, E> metricGraph,
			WeightedGraph<V, E> analysisGraph, Supplier<V> supplierVertex) {
		super();
		this.metricGraph = metricGraph;
		this.analysisGraph = analysisGraph;
		this.supplierVertex = supplierVertex;
	}

	public WeightedGraph<V, E> getMetricGraph() {
		return metricGraph;
	}

	public WeightedGraph<V, E> getAnalysisGraph() {
		return analysisGraph;
	}

	public VirtualRoot<V, E> createVirutalRoot(Collection<V> sources) {
		V root = supplierVertex.get();
		List<VirtualRoot<V, E>> roots = new ArrayList<>();
		roots.add(new DefaultVirtualRoot<>(metricGraph, root, sources));
		roots.add(new DefaultVirtualRoot<>(analysisGraph, root, sources));
		return new CompositeVirtualRoot<>(root, roots);
	}

}
