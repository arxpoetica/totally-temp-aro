package com.altvil.aro.service.graph.alg.stiener;

import java.util.HashMap;
import java.util.Map;

import org.jgrapht.WeightedGraph;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.AllShortestPaths;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class StrategySmall<V, E extends AroEdge<GeoSegment>> implements
		ClosestRouteStrategy<V, E> {

	@SuppressWarnings("unused")
	private static final Logger log = LoggerFactory
			.getLogger(StrategySmall.class.getName());

	private WeightedGraph<V, E> graph;
	private ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder;
	private Map<V, SpanningShortestPath<V, E>> cachedMap = new HashMap<>() ;

	public StrategySmall(WeightedGraph<V, E> graph,
			ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder) {
		super();
		this.graph = graph;
		this.closestFirstSurfaceBuilder = closestFirstSurfaceBuilder;
	}

	@Override
	public SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		
		SpanningShortestPath<V, E> ssp = cachedMap.get(source) ;
		if( ssp == null ) {
			cachedMap.put(source, ssp = new AllShortestPaths<V, E>(graph, closestFirstSurfaceBuilder,
					source));
		}
		return ssp ;

	}

	

}
