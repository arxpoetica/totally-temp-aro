package com.altvil.aro.service.graph.alg.stiener;

import java.util.List;

import org.jgrapht.GraphPath;

public interface SpanningGraphPath<V, E> extends GraphPath<V, E> {
	
	public List<V> getReverseVertexList() ;
	public List<E> getReversedEdgeList() ;

}
