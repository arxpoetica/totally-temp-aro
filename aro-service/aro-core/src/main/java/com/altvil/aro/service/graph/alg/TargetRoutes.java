package com.altvil.aro.service.graph.alg;

import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

public class TargetRoutes<V, E> {
	
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
		routes.forEach( r -> result.addAll(r.getPath().getEdgeList()));
		return result ;
	}

}
