package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface PlanService {

	/**
	 * 
	 * @param networkData
	 * @param inputRequests 
	 * @param request
	 * @return
	 * @throws PlanException
	 */
	public Optional<CompositeNetworkModel> computeNetworkModel(NetworkData networkData,
			NetworkConfiguration configuration, FiberNetworkConstraints request) throws PlanException;

	/**
	 * @param request
	 * @return
	 */
	public FtthThreshholds createFtthThreshholds(FiberNetworkConstraints request);

}
