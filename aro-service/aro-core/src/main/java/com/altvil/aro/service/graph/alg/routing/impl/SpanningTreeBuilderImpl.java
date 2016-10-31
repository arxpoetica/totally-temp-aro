package com.altvil.aro.service.graph.alg.routing.impl;

import java.util.Collection;

import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.alg.routing.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.routing.SpanningTree;
import com.altvil.aro.service.graph.alg.routing.SpanningTreeBuilder;
import com.altvil.aro.service.graph.alg.routing.SpanningTreeEventListener;
import com.altvil.aro.service.graph.alg.routing.spi.MetricEdgeWeight;

public class SpanningTreeBuilderImpl<V, E> implements SpanningTreeBuilder<V, E> {

	private SourceGraph<V, E> sourceGraph;

	private Collection<V> sources;
	private MetricEdgeWeight<E> metricEdgeWeight;
	private GraphPathConstraint<V, E> predicate;
	private SpanningTreeEventListener<V> eventListener;

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
	public SpanningTreeBuilder<V, E> setEventListener(
			SpanningTreeEventListener<V> eventListener) {
		this.eventListener = eventListener ;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setMetricEdgeWeight(
			MetricEdgeWeight<E> metricEdgeWeight) {
		this.metricEdgeWeight = metricEdgeWeight;
		return this;
	}

	@Override
	public SpanningTreeBuilder<V, E> setSources(Collection<V> sources) {
		this.sources = sources;
		return this;
	}

	private SpanningTreeEventListener<V> getSpanningTreeEventListener() {
		return eventListener == null ? new SpanningTreeEventListener<V>() {
			public void onConstraintViolated(V vertex) {
			}
		} : eventListener;
	}

	@Override
	public SpanningTree<V, E> build() {
		Collection<SourceRoute<V, E>> sourcesRoutes = new SpanningTreeAlgorithmImpl<V, E>(
				getSpanningTreeEventListener(),
				metricEdgeWeight, sourceGraph, predicate, sources, targets)
				.build();
		return new SpanningTree<V, E>() {
			@Override
			public Collection<SourceRoute<V, E>> getSourceRoutes() {
				return sourcesRoutes;
			}

			@Override
			public SourceRoute<V, E> getSourceRoute() {
				return sourcesRoutes.iterator().next();
			}

		};
	}

}
