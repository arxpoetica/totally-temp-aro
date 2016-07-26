package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.SourceRoute.DagEdgeImpl;
import com.altvil.aro.service.graph.segment.GeoSegment;

interface DagEdge<V, E extends AroEdge<GeoSegment>> {

	public abstract V getSourceVertex();

	public abstract V getTargetVertex();

	public abstract Collection<E> getEdges();

	public abstract Collection<DagEdge<V, E>> getChildren();

}