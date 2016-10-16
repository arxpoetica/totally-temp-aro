package com.altvil.aro.service.graph.alg.routing;

import java.util.Collection;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.SourceRoute;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface SpanningTree<V, E extends AroEdge<GeoSegment>> {

	Collection<SourceRoute<V, E>> getSourceRoutes() ;
	SourceRoute<V,E> getSourceRoute() ;
	
}
