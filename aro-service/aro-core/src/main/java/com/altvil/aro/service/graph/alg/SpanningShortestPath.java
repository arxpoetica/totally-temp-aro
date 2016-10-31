package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import com.altvil.aro.service.graph.alg.routing.spi.SpanningGraphPath;

public interface SpanningShortestPath<V, E> {
	
	public boolean isForced() ;
	public void updateNetworkPath(V vertex) ;
	public double updateNetworkPath(Collection<V> vertices) ;
	public SpanningGraphPath<V, E> getGraphPath();
	public double getWeight();

}