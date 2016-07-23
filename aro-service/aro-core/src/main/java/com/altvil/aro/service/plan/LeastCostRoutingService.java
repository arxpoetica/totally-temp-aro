package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface LeastCostRoutingService {

	Optional<CompositeNetworkModel> computeNetworkModel(
			NetworkData networkData, FtthThreshholds consraints)
			throws PlanException;
	

}
