package com.altvil.aro.service.graph.alg.routing.spi;

import java.util.List;

import org.jgrapht.GraphPath;

public interface SpanningGraphPath<V, E> extends GraphPath<V, E> {
	
	public List<V> getReverseVertexList() ;
	public List<E> getReversedEdgeList() ;

}
