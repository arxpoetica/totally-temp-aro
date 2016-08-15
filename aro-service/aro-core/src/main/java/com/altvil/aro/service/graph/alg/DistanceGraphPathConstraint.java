package com.altvil.aro.service.graph.alg;

import org.jgrapht.GraphPath;
import org.jgrapht.alg.DijkstraShortestPath;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.GraphModel;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;

public class DistanceGraphPathConstraint<V, E extends AroEdge<GeoSegment>>
		implements GraphPathConstraint<V, AroEdge<GeoSegment>> {

	private static final Logger log = LoggerFactory
			.getLogger(DistanceGraphPathConstraint.class.getName());
	
	private GraphModel<GeoSegment> graph ;
	private GraphNode source  ;
	private double distanceInMeters;

	public DistanceGraphPathConstraint( GraphModel<GeoSegment> graph, GraphNode source, double distanceInMeters) {
		super();
		this.graph = graph ;
		this.source = source ;
		this.distanceInMeters = distanceInMeters;
	}

	@Override
	public boolean isValid(SourceRoute<V, AroEdge<GeoSegment>> sourceRoot,
			GraphPath<V, AroEdge<GeoSegment>> graphPath) {

		double pathLength = graphPath.getEdgeList().stream()
				.mapToDouble(e -> e.getValue().getLength()).sum();
		double distance = sourceRoot.getDistance(graphPath.getEndVertex());
		double totalDistance = distance + pathLength ;
		
		if( totalDistance < distanceInMeters ) {
			
			double verified = new DijkstraShortestPath<GraphNode, AroEdge<GeoSegment>>(graph.getGraph(), source, (GraphNode) graphPath.getStartVertex()).getPathLength() ;
			log.info("Route Condition Failed " + totalDistance + " " + verified) ;
		}
		
		return totalDistance <= distanceInMeters;

	}

}
