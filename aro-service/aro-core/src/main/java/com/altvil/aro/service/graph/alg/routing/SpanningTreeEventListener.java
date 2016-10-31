package com.altvil.aro.service.graph.alg.routing;

public interface SpanningTreeEventListener<V> {
	
	public void onConstraintViolated(V vertex) ;

}
