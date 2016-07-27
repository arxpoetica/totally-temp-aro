package com.altvil.aro.service.optimize.impl;

import java.util.function.Predicate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkConstraint;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.NetworkAnalysisFactory;
import com.altvil.aro.service.optimize.spi.NetworkConstrainer;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.google.inject.Inject;

@Service("fttHOptimizerService")
public class FTTHOptimizerServiceImpl implements FTTHOptimizerService {

	private NetworkAnalysisFactory networkAnalysisFactory;
	private NetworkModelBuilderFactory networkModelBuilderFactory;

	@Autowired
	@Inject
	public FTTHOptimizerServiceImpl(
			NetworkAnalysisFactory networkAnalysisFactory,
			NetworkModelBuilderFactory networkModelBuilderFactory) {
		super();
		this.networkAnalysisFactory = networkAnalysisFactory;
		this.networkModelBuilderFactory = networkModelBuilderFactory;
	}

	@Override
	public NetworkPlanner createNetworkPlanner(
			NetworkConstraint constraint, NetworkData networkData,
			OptimizerContext ctx,
			Predicate<GeneratingNode> generatingNodeConstraint,
			ScoringStrategy scoringStrategy) {
		
		PruningStrategy strategy  = new PruningStrategy() {
			
			@Override
			public boolean isCandidatePlan(OptimizedNetwork network) {
				return false;
			}
			
			@Override
			public boolean isGeneratingNodeValid(GeneratingNode node) {
				return true;
			}
			
			@Override
			public boolean isConstraintSatisfied(NetworkAnalysis node) {
				return false;
			}
			
		};
		
		return createNetworkPlanner(networkData, strategy, scoringStrategy, ctx) ;
		
		
	}

	@Override
	public NetworkPlanner createNetworkPlanner(NetworkData networkData,
			PruningStrategy pruningStrategy, ScoringStrategy scoringStrategy, OptimizerContext ctx) {

		return DefaultNetworkPlannerImpl.create(createConstrainer(networkData,
				ctx, pruningStrategy, scoringStrategy));

	}

	private NetworkConstrainer createConstrainer(NetworkData networkData,
			OptimizerContext ctx, PruningStrategy pruningStrategy,
			ScoringStrategy scoringStrategy) {

		
		NetworkModelBuilder networkModelBuilder = networkModelBuilderFactory
				.create(networkData,
						ctx.getFtthThreshholds());

		NetworkAnalysis networkAnalysis = networkAnalysisFactory
				.createNetworkAnalysis(networkModelBuilder, ctx,
						scoringStrategy);

		return NetworkConstrainer.create(networkModelBuilder, pruningStrategy,
				networkAnalysis);
	}

//	private NetworkConstrainer createConstrainer(
//			ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
//			NetworkConstraint constraint, NetworkData networkData,
//			OptimizerContext ctx,
//			Predicate<GeneratingNode> generatingNodeConstraint,
//			ScoringStrategy scoringStrategy) {
//
//		NetworkModelBuilder networkModelBuilder = networkModelBuilderFactory
//				.create(networkData, closestFirstSurfaceBuilder,
//						ctx.getFtthThreshholds(), null);
//		NetworkAnalysis networkAnalysis = networkAnalysisFactory
//				.createNetworkAnalysis(networkModelBuilder, ctx,
//						scoringStrategy);
//
//		return NetworkConstrainer.create(networkModelBuilder,
//				generatingNodeConstraint, constraint::requiredNode,
//				constraint::isConstraintMet, networkAnalysis);
//	}

}
