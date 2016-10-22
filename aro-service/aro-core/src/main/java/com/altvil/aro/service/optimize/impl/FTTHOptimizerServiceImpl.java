package com.altvil.aro.service.optimize.impl;

import java.util.function.Predicate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.assigment.GraphEdgeAssignment;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkConstraint;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.NetworkAnalysisFactory;
import com.altvil.aro.service.optimize.spi.NetworkConstrainer;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.optimize.spi.PruningStrategy;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.altvil.aro.service.optimize.spi.impl.DefaultPruningStrategy;
import com.google.inject.Inject;

@Service("fttHOptimizerService")
public class FTTHOptimizerServiceImpl implements FTTHOptimizerService {

	private NetworkAnalysisFactory networkAnalysisFactory;
	private NetworkModelBuilderFactory networkModelBuilderFactory;
	private ApplicationContext appCtx;

	@Autowired
	@Inject
	public FTTHOptimizerServiceImpl(ApplicationContext appCtx,
			NetworkAnalysisFactory networkAnalysisFactory,
			NetworkModelBuilderFactory networkModelBuilderFactory) {
		super();
		this.appCtx = appCtx;
		this.networkAnalysisFactory = networkAnalysisFactory;
		this.networkModelBuilderFactory = networkModelBuilderFactory;
	}

	@Override
	public NetworkPlanner createNetworkPlanner(NetworkConstraint constraint,
			NetworkData networkData,  OptimizerContextBuilder ctxBuilder,
			Predicate<GeneratingNode> generatingNodeConstraint,
			ScoringStrategy scoringStrategy) {

		PruningStrategy strategy = DefaultPruningStrategy.STRATEGY ;
		return createNetworkPlanner(networkData, strategy, scoringStrategy, ctxBuilder, null);

	}

	@Override
	public NetworkPlanner createNetworkPlanner(NetworkData networkData,
			PruningStrategy pruningStrategy, ScoringStrategy scoringStrategy,
			OptimizerContextBuilder ctxBuilder, Predicate<GraphEdgeAssignment> lockedPredicate) {

		return DefaultNetworkPlannerImpl.create(createConstrainer(networkData,
				ctxBuilder, pruningStrategy, scoringStrategy, lockedPredicate));

	}

	private NetworkConstrainer createConstrainer(NetworkData networkData,
												 OptimizerContextBuilder ctxBuilder,
												 PruningStrategy pruningStrategy,
												 ScoringStrategy scoringStrategy,
												 Predicate<GraphEdgeAssignment> lockedPredicate) {

		NetworkModelBuilder networkModelBuilder = networkModelBuilderFactory
				.create(networkData, ctxBuilder);

		NetworkAnalysis networkAnalysis = networkAnalysisFactory
				.createNetworkAnalysis(networkModelBuilder,
						ctxBuilder.createOptimizerContext(appCtx),
						scoringStrategy, lockedPredicate);

		return NetworkConstrainer.create(networkModelBuilder, pruningStrategy,
				networkAnalysis);
	}



}
