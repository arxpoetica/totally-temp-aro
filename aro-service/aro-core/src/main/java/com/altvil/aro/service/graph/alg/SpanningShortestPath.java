package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.stiener.SpanningGraphPath;

public interface SpanningShortestPath<V, E extends AroEdge<?>> {

	public double updateNetworkPath(Collection<V> vertices) ;
	public SpanningGraphPath<V, E> getGraphPath();
	public double getWeight();

}