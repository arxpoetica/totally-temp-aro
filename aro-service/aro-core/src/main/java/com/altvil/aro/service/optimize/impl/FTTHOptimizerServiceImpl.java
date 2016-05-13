package com.altvil.aro.service.optimize.impl;

import com.altvil.aro.service.graph.model.NetworkConfiguration;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkConstraint;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.*;
import com.google.inject.Inject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.function.Predicate;

@Service
public class FTTHOptimizerServiceImpl implements FTTHOptimizerService {

	private NetworkAnalysisFactory networkAnalysisFactory;
	private NetworkModelBuilderFactory networkModelBuilderFactory;

	@Autowired
	@Inject
	public FTTHOptimizerServiceImpl(NetworkAnalysisFactory networkAnalysisFactory,
									NetworkModelBuilderFactory networkModelBuilderFactory) {
		super();
		this.networkAnalysisFactory = networkAnalysisFactory;
		this.networkModelBuilderFactory = networkModelBuilderFactory;
	}

	@Override
	public NetworkPlanner createNetworkPlanner(NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration, NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstraint, ScoringStrategy scoringStrategy) {
		return DefaultNetworkPlannerImpl.create(createConstrainer(networkStrategyRequest, networkConfiguration, constraint, networkData, ctx, generatingNodeConstraint, scoringStrategy));
	}

	private NetworkConstrainer createConstrainer(NetworkStrategyRequest networkStrategyRequest, NetworkConfiguration networkConfiguration, NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstraint, ScoringStrategy scoringStrategy) {
		NetworkModelBuilder networkModelBuilder = networkModelBuilderFactory
				.create(networkData, networkStrategyRequest, networkConfiguration, ctx.getFiberNetworkConstraints());
		NetworkAnalysis networkAnalysis = networkAnalysisFactory
				.createNetworkAnalysis(networkModelBuilder,
						ctx, scoringStrategy);

		return NetworkConstrainer.create(networkModelBuilder, generatingNodeConstraint, constraint::isConstraintMet, networkAnalysis);
	}




}
