package com.altvil.aro.service.optimize;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import java.util.function.Predicate;

public interface FTTHOptimizerService {

	NetworkPlanner createNetworkPlanner(NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration configurationuests, NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstraint, ScoringStrategy scoringStrategy);
	
}
