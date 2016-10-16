package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;

import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.SpanningTree;
import com.altvil.aro.service.graph.alg.routing.SpanningTreeBuilder;
import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;

public class SpanningTreeBuilderImpl<V, E> implements SpanningTreeBuilder<V, E> {

	private SourceGraph<V, E> sourceGraph;
	
	private MetricEdgeWeight<E> metricEdgeWeight;
	private GraphPathConstraint<V, E> predicate;

	private Collection<V> targets;

	@Override
	public SpanningTreeBuilder<V, E> setSourceGraph(
			SourceGraph<V, E> sourceGraph) {
		this.sourceGraph = sourceGraph;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setGraphPathConstraint(
			GraphPathConstraint<V, E> predicate) {
		this.predicate = predicate;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setTargets(Collection<V> targets) {
		this.targets = targets;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setMetricEdgeWeight(
			MetricEdgeWeight<E> metricEdgeWeight) {
		this.metricEdgeWeight = metricEdgeWeight;
		return this;
	}

	@Override
	public SpanningTree<V, E> build() {
		new SpanningTreeAlgorithmImpl<V, E>(metricEdgeWeight, sourceGraph,
				predicate,  targets)
				.build();
		return null;
	}

}
