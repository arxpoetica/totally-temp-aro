package com.altvil.aro.service.optimize.impl;

import java.util.function.Predicate;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.builder.ClosestFirstSurfaceBuilder;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.node.GraphNode;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.optimize.FTTHOptimizerService;
import com.altvil.aro.service.optimize.NetworkConstraint;
import com.altvil.aro.service.optimize.NetworkPlanner;
import com.altvil.aro.service.optimize.OptimizerContext;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.optimize.spi.NetworkAnalysis;
import com.altvil.aro.service.optimize.spi.NetworkAnalysisFactory;
import com.altvil.aro.service.optimize.spi.NetworkConstrainer;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilder;
import com.altvil.aro.service.optimize.spi.NetworkModelBuilderFactory;
import com.altvil.aro.service.optimize.spi.ScoringStrategy;
import com.google.inject.Inject;

@Service("fttHOptimizerService")
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
	public NetworkPlanner createNetworkPlanner(ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstraint, ScoringStrategy scoringStrategy) {
		return DefaultNetworkPlannerImpl.create(createConstrainer(closestFirstSurfaceBuilder, constraint, networkData, ctx, generatingNodeConstraint, scoringStrategy));
	}

	private NetworkConstrainer createConstrainer(ClosestFirstSurfaceBuilder<GraphNode, AroEdge<GeoSegment>> closestFirstSurfaceBuilder,
			NetworkConstraint constraint, NetworkData networkData, OptimizerContext ctx, Predicate<GeneratingNode> generatingNodeConstraint, ScoringStrategy scoringStrategy) {
		NetworkModelBuilder networkModelBuilder = networkModelBuilderFactory
				.create(networkData, closestFirstSurfaceBuilder, ctx.getFtthThreshholds(), null);
		NetworkAnalysis networkAnalysis = networkAnalysisFactory
				.createNetworkAnalysis(networkModelBuilder,
						ctx, scoringStrategy);

		return NetworkConstrainer.create(networkModelBuilder, generatingNodeConstraint, constraint::isConstraintMet, networkAnalysis);
	}




}
