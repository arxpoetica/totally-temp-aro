package com.altvil.aro.service.graph.alg.routing;

import java.util.Collection;

import com.altvil.aro.service.graph.alg.SourceRoute;

public interface SpanningTree<V, E> {

	Collection<SourceRoute<V, E>> getSourceRoutes() ;
	SourceRoute<V,E> getSourceRoute() ;
	
}
