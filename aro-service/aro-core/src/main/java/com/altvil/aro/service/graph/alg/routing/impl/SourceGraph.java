package com.altvil.aro.service.graph.alg.routing.impl;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.routing.VirtualRoot;

public class SourceGraph<V, E> {

	private WeightedGraph<V,E> metricGraph ;
	private WeightedGraph<V,E> analysisGraph ;
	private VirtualRoot<V, E> virtualRoot ;
	
	public SourceGraph(WeightedGraph<V, E> metricGraph,
			WeightedGraph<V, E> analysisGraph, VirtualRoot<V, E> virtualRoot) {
		super();
		this.metricGraph = metricGraph;
		this.analysisGraph = analysisGraph;
		this.virtualRoot = virtualRoot;
	}

	public WeightedGraph<V, E> getMetricGraph() {
		return metricGraph ;
	}

	public WeightedGraph<V, E> getAnalysisGraph() {
		return analysisGraph;
	}

	public VirtualRoot<V, E> getVirtualRoot() {
		return virtualRoot;
	}

}
