package com.altvil.aro.service.optimize;

import java.io.Serializable;
import java.util.function.Predicate;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;

public interface FTTHOptimizerService {
	
	public interface OptimizerContextBuilder extends Serializable {
		OptimizerContext createOptimizerContext(ApplicationContext ctx) ;
	}

	@Deprecated
	NetworkPlanner createNetworkPlanner(NetworkConstraint constraint,
			NetworkData networkData, OptimizerContextBuilder ctxBuilder,
			Predicate<GeneratingNode> generatingNodeConstraint,
			ScoringStrategy scoringStrategy);

	NetworkPlanner createNetworkPlanner(NetworkData networkData,
			PruningStrategy pruningStrategy, ScoringStrategy scoringStrategy,
			OptimizerContextBuilder ctxBuilder);

}
