package com.altvil.aro.service.graph.alg;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class SourceRoute<V, E extends AroEdge<GeoSegment>> {
	
	private final V sourceVertex ;
	private  List<TargetRoute<V, E>> subRoutes  = new ArrayList<>() ;
	private Set<V> targets = new HashSet<>() ;
	
	public SourceRoute(V sourceVertex) {
		super();
		this.sourceVertex = sourceVertex;
	}

	public V getSourceVertex() {
		return sourceVertex ;
	}
	
	public TargetRoutes<V, E> getSubRoutes() {
		return new TargetRoutes<>(subRoutes) ;
	}
	
	public void add(V src, V target, Set<E> path) {
		targets.add(src) ;
		subRoutes.add(new TargetRoute<>(target, src, path)) ;
	}
	
	public Set<V> getTargets() {
		return targets ;
	}
	
	public Set<E> getAllEdges() {
		Set<E> result = new HashSet<>() ;
		subRoutes.forEach( r -> result.addAll(r.getPath()));
		return result ;
	}
	

}
