package com.altvil.aro.service.graph.alg;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class TargetRoute<V, E extends AroEdge<GeoSegment>> {

	private GraphPath<V, E> path;
	
	public TargetRoute(GraphPath<V, E> path) {
		super();
		this.path = path;
	}

	public V getSourceVertex() {
		return path.getStartVertex() ;
	}

	public V getTargetVertex() {
		return path.getEndVertex() ;
	}

	public GraphPath<V, E> getPath() {
		return path;
	}
	
	

}
