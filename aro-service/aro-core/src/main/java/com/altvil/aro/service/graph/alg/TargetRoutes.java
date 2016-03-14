package com.altvil.aro.service.graph.alg;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class TargetRoutes<V, E extends AroEdge<GeoSegment>> {
	
	private Collection<TargetRoute<V, E>> routes ;
	
	public TargetRoutes(Collection<TargetRoute<V, E>> routes) {
		super();
		this.routes = routes;
	}

	public Collection<TargetRoute<V, E>> getTargetRoutes() { 
		return routes ;
	}
	
	public Set<E> getAllEdges() {
		Set<E> result = new HashSet<>() ;
		routes.forEach( r -> result.addAll(r.getPath()));
		return result ;
	}

}
