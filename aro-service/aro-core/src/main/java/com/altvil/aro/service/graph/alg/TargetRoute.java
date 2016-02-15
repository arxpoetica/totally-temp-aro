package com.altvil.aro.service.graph.alg;

import java.util.Set;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class TargetRoute<V, E extends AroEdge<GeoSegment>> {

	private V sourceVertex;
	private V targetVertex;
	private Set<E> path;

	public TargetRoute(V sourceVertex, V targetVertex, Set<E> path) {
		super();
		this.sourceVertex = sourceVertex;
		this.targetVertex = targetVertex;
		this.path = path;
	}

	public V getSourceVertex() {
		return sourceVertex;
	}

	public V getTargetVertex() {
		return targetVertex;
	}

	public Set<E> getPath() {
		return path;
	}

}
