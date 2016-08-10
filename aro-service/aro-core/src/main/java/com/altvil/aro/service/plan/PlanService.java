package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface PlanService {
	
	public Optional<CompositeNetworkModel> computeNetworkModel(GraphNetworkModel networkModel,
			FtthThreshholds consraints) throws PlanException;
	
	/**
	 * 
	 * @param networkData
	 * @param networkStrategyRequest 
	 * @param inputRequests 
	 * @param request
	 * @return
	 * @throws PlanException
	 */

	public Optional<CompositeNetworkModel> computeNetworkModel(GraphNetworkModel networkModel,
			ClosestFirstSurfaceBuilder closestFirstSurfaceBuilder,
			FtthThreshholds request) throws PlanException;
	
}
