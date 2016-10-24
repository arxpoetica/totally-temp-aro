package com.altvil.aro.service.optimize.spi;

import java.util.function.Predicate;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.optimize.OptimizerContext;

public interface NetworkAnalysisFactory {

	public abstract NetworkAnalysis createNetworkAnalysis(
			NetworkModelBuilder networkModelBuilder,
			OptimizerContext ctx, 
			ScoringStrategy scoringStragey,
			Predicate<GraphEdgeAssignment> lockedPredicate);

}