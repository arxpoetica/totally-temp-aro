package com.altvil.aro.service.graph.alg;

import java.util.Collection;

import org.jgrapht.GraphPath;

import com.altvil.aro.service.graph.AroEdge;

public interface SpanningShortestPath<V, E extends AroEdge<?>> {

	public double seedOrigin(V origin) ;
	public double updateNetworkPath(Collection<V> vertices) ;
	
	//public V findClosestTarget(V target) ;
	//public V findClosestTarget(Collection<V> targets);
	
	public GraphPath<V, E> getGraphPath();
	public double getWeight();

}