package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface PlanService {
	/**
	 * 
	 * @param networkData
	 * @param networkStrategyRequest 
	 * @param inputRequests 
	 * @param request
	 * @return
	 * @throws PlanException
	 */
	public Optional<CompositeNetworkModel> computeNetworkModel(NetworkData networkData,
			ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			FtthThreshholds request, GlobalConstraint globalConstraint) throws PlanException;

}
