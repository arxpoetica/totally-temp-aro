package com.altvil.aro.service.graph.alg.stiener;

import org.jgrapht.WeightedGraph;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class SourceGraph<V, E extends AroEdge<GeoSegment>> {
	
	public V createVertex() {
		return null ;
	}
	
	
	public WeightedGraph<V, E> getGraph() {
		return null ;
	}
	
	public WeightedGraph<V, E> getMarkGraph() {
		return null ;
	}

}
