package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

interface DagEdge<E extends AroEdge<GeoSegment>> {

	public abstract GraphNode getSourceVertex();

	public abstract GraphNode getTargetVertex();

	public abstract Collection<E> getEdges();

	public abstract Collection<DagEdge<E>> getChildren();

}