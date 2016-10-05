package com.altvil.aro.service.graph.alg.stiener;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Predicate;

import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.AllShortestPaths;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.GraphPathConstraint.MetricDistance;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class StrategySmall<V, E extends AroEdge<GeoSegment>> implements ClosestRouteStrategy<V, E> {

	private static final Logger log = LoggerFactory
			.getLogger(StrategySmall.class.getName());

	
	private WeightedGraph<V, E> graph ;
	private ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder ;
	
	public StrategySmall(WeightedGraph<V, E> graph,
			ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder) {
		super();
		this.graph = graph;
		this.closestFirstSurfaceBuilder = closestFirstSurfaceBuilder;
	}

	@Override
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return new AllShortestPaths<V,E>(graph, closestFirstSurfaceBuilder, source) ;
		
	}

	@Override
	public Predicate<V> vertexPredicate(Collection<V> allRoots,
			GraphPathConstraint<V, E> pathPredicate) {
		MetricDistance<V> md = (V) -> 0.0;
		
		Map<V, AllShortestPaths<V, E>> map = new HashMap<>() ;
		allRoots.forEach(s -> {
			map.put(s,  new AllShortestPaths<V, E>(graph, closestFirstSurfaceBuilder, s)) ;
		});
		
		return (target) -> {
			
			for(AllShortestPaths<V, E> asp : map.values()) {
				if( pathPredicate.isValid(md, asp.getGraphPath(target))) {
					return true ;
				}
			}
			
			log.error("Vertex Fails Network Constaint " + target);

			return false;
		};
	}

}
