package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;
import com.altvil.aro.service.network.NetworkStrategyRequest;

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
			NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration configuration, FiberNetworkConstraints request) throws PlanException;

	/**
	 * @param request
	 * @return
	 */
	public FtthThreshholds createFtthThreshholds(FiberNetworkConstraints request);

}
