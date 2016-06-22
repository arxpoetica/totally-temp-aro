package com.altvil.aro.service.optimize;

import java.util.function.Predicate;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;

public interface FTTHOptimizerService {

	NetworkPlanner createNetworkPlanner(ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstraint, ScoringStrategy scoringStrategy);
	
}
