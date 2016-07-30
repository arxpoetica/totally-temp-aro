package com.altvil.aro.service.plan;

import java.util.Optional;

import com.altvil.aro.service.graph.builder.GraphNetworkModel;
import com.altvil.aro.service.graph.transform.ftp.FtthThreshholds;

public interface CoreLeastCostRoutingService {
	
	
	Optional<CompositeNetworkModel> computeNetworkModel(
			GraphNetworkModel model, FtthThreshholds consraints)
			throws PlanException;
	

}
