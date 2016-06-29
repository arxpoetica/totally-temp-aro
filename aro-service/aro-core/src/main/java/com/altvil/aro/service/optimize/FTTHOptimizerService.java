package com.altvil.aro.service.optimize;

import java.util.function.Predicate;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;

public interface FTTHOptimizerService {

	@Deprecated
	NetworkPlanner createNetworkPlanner(NetworkConstraint constraint,
			NetworkData networkData, OptimizerContext ctx,
			Predicate<GeneratingNode> generatingNodeConstraint,
			ScoringStrategy scoringStrategy);

	NetworkPlanner createNetworkPlanner(NetworkData networkData,
			PruningStrategy pruningStrategy, ScoringStrategy scoringStrategy,
			OptimizerContext ctx);

}
