package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;
import java.util.function.Function;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.SpanningTree;
import com.altvil.aro.service.graph.alg.routing.SpanningTreeBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class SpanningTreeBuilderImpl<V, E extends AroEdge<GeoSegment>>
		implements SpanningTreeBuilder<V, E> {

	private Function<WeightedGraph<V, E>, WeightedGraph<V, E>> transform;
	private WeightedGraph<V, E> weightedGraph;
	private GraphPathConstraint<V, E> predicate;

	private Collection<V> sources;
	private Collection<V> targets;

	@Override
	public SpanningTreeBuilder<V, E> setAnalysisTransform(
			Function<WeightedGraph<V, E>, WeightedGraph<V, E>> transform) {
		this.transform = transform;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setGraph(WeightedGraph<V, E> graph) {
		this.weightedGraph = graph;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setGraphPathConstraint(
			GraphPathConstraint<V, E> predicate) {
		this.predicate = predicate;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setSources(Collection<V> sources) {
		this.sources = sources;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setTargets(Collection<V> targets) {
		this.targets = targets;
		return this;
	}

	@Override
	public SpanningTree<V, E> build() {
		// TODO Auto-generated method stub
		return null;
	}

}
