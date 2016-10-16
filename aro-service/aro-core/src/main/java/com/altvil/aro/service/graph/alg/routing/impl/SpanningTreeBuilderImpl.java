package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;
import java.util.function.Function;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.SpanningTree;
import com.altvil.aro.service.graph.alg.routing.SpanningTreeBuilder;
import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;

public class SpanningTreeBuilderImpl<V, E>
		implements SpanningTreeBuilder<V, E> {
	

	private Function<WeightedGraph<V, E>, WeightedGraph<V, E>> transform;
	private MetricEdgeWeight<E> metricEdgeWeight;

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
	public SpanningTreeBuilder<V, E> setMetricEdgeWeight(
			MetricEdgeWeight<E> metricEdgeWeight) {
		this.metricEdgeWeight = metricEdgeWeight;
		return this;
	}

	@Override
	public SpanningTree<V, E> build() {
		
		new SpanningTreeAlgorithmImpl<V,E>(metricEdgeWeight, null,
				predicate, sources, targets).build() ;
		return null;
	}

}
