package com.altvil.aro.service.plan;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

import java.util.Optional;

public interface PlanService {

	/**
	 * 
	 * @param networkData
	 * @param request
	 * @return
	 * @throws PlanException
	 */
	public Optional<CompositeNetworkModel> computeNetworkModel(NetworkData networkData,
			FiberNetworkConstraints request) throws PlanException;

	/**
	 * @param request
	 * @return
	 */
	public FtthThreshholds createFtthThreshholds(FiberNetworkConstraints request);

}
