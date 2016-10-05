package com.altvil.aro.service.graph.alg.stiener;

import java.util.Collection;
import java.util.function.Predicate;

import org.jgrapht.Graph;
import org.jgrapht.alg.FloydWarshallShortestPaths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.alg.GraphPathConstraint;
import com.altvil.aro.service.graph.alg.GraphPathConstraint.MetricDistance;
import com.altvil.aro.service.graph.alg.SpanningShortestPath;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class StrategyLarge<V, E extends AroEdge<GeoSegment>> implements ClosestRouteStrategy<V, E> {
	
	
	private static final Logger log = LoggerFactory
			.getLogger(DefaultRouteBuilder.class.getName());

	private FloydWarshallShortestPaths<V, E> allPaths;
	
	public StrategyLarge(Graph<V,E> sourceGraph) {
		this.allPaths = new FloydWarshallShortestPaths<V, E>(sourceGraph);
	}
	
	@Override
	public  SpanningShortestPath<V, E> createSpanningShortestPath(V source) {
		return new FastAllShortestPaths<V, E>(source,
				allPaths) ;
	}
	
	public Predicate<V> vertexPredicate(Collection<V> allRoots,
			GraphPathConstraint<V, E> pathPredicate) {

		MetricDistance<V> md = (V) -> 0.0;

		return (target) -> {
			for (V source : allRoots) {
				if (pathPredicate.isValid(md,
						allPaths.getShortestPath(target, source))) {
					return true;
				}
			}

			log.error("Vertex Fails Network Constaint " + target);

			return false;
		};
	}
	
	
}
