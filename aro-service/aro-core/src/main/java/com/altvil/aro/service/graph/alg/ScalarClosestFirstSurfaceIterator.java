package com.altvil.aro.service.graph.alg;

import org.jgrapht.Graph;
import org.jgrapht.WeightedGraph;
import org.jgrapht.traverse.ClosestFirstIterator;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;

public class ScalarClosestFirstSurfaceIterator<V, E> extends ClosestFirstIterator<V, E> implements ClosestFirstSurfaceIterator<V, E> {
	private static class Builder implements ClosestFirstSurfaceBuilder {
		@Override
		public <V, E extends AroEdge<?>> ClosestFirstSurfaceIterator<V, E> build(WeightedGraph<V, E> graph,
				V startVertex) {
			return new ScalarClosestFirstSurfaceIterator<>(graph, startVertex);
		}		
	}
	
	public static final ClosestFirstSurfaceBuilder BUILDER = new Builder();

	public ScalarClosestFirstSurfaceIterator(Graph<V, E> g, V startVertex, double radius) {
		super(g, startVertex, radius);
	}

	public ScalarClosestFirstSurfaceIterator(Graph<V, E> g, V startVertex) {
		super(g, startVertex);
	}

	public ScalarClosestFirstSurfaceIterator(Graph<V, E> g) {
		super(g);
	}

	@Override
	public boolean isGlobalConstraintMet() {
		return true;
	}
}
