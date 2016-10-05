package com.altvil.aro.service.graph.alg.stiener;

import java.util.Collection;
import java.util.function.Predicate;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.segment.GeoSegment;

public interface ClosestRouteStrategy<V, E extends AroEdge<GeoSegment>> {

	public  SpanningShortestPath<V, E> createSpanningShortestPath(V source) ;
	
	public Predicate<V> vertexPredicate(Collection<V> allRoots,
			GraphPathConstraint<V, E> pathPredicate) ;
	
}