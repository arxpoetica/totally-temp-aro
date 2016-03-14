package com.altvil.aro.service.optimize;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.model.GeneratingNode;

import java.util.function.Predicate;

public interface FTTHOptimizerService {

	NetworkPlanner createNetworkPlanner(NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstrain);
	
}
