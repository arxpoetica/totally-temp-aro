package com.altvil.aro.service.optimize.spi;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.impl.AnalysisNodeImpl;
import com.altvil.aro.service.optimize.impl.LazyOptimizedNetwork;
import com.altvil.aro.service.optimize.model.AnalysisNode;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public class NetworkConstrainer {

	private static final Logger log = LoggerFactory
			.getLogger(NetworkConstrainer.class.getName());

	private PruningStrategy pruningStrategy;
	private NetworkAnalysis networkAnalysis;

	private NetworkConstrainer(PruningStrategy pruningStrategy, NetworkAnalysis networkAnalysis) {
		super();
		this.pruningStrategy = pruningStrategy;
		this.networkAnalysis = networkAnalysis;

	}

	public static NetworkConstrainer create(
			PruningStrategy pruningStrategy, NetworkAnalysis networkAnalysis) {
		return new NetworkConstrainer(pruningStrategy,
				networkAnalysis);
	}

	public List<OptimizedNetwork> constrainNetwork() {
		ResultAssembler resultAssembler = new ResultAssembler();

		Predicate<OptimizedNetwork> candiatePlanPredicate = pruningStrategy
				.getPredicate(PredicateStrategyType.CANDIDATE_PLAN);
		
		Predicate<NetworkAnalysis>  constraintSatisfiedPredicate = pruningStrategy
		.getPredicate(PredicateStrategyType.CONSTRAINT_STATISFIED);

		Predicate<GeneratingNode> pruneCandidatePredicate = pruningStrategy
				.getPredicate(PredicateStrategyType.PRUNE_CANDIDATE);


		if (networkAnalysis != null) {
			{
				// Remove nodes that do not satisfy the generating node
				// constraint. Nodes are removed from least desirable to most
				// with the score (desirability) of the remaining nodes
				// recalculated each time the least desirable node is removed.
				GeneratingNode node;

				while ((node = networkAnalysis
						.getMinimumNode(pruningStrategy
								.getPredicate(PredicateStrategyType.INITIAL_PRUNE_CANDIDATE))) != null) {
					node.remove();
				}
			}

			// Set<LocationEntity> rejectedLocations = new HashSet<>();
			// rejectedLocations.add(null);

			VerifyDifferentNetwork verifyDifferentNetwork = new VerifyDifferentNetwork();

			boolean optimized = false;
			while (!optimized) {
				if (networkAnalysis.getAnalyisNode() == null) {
					// Empty Delta

					optimized = true;
				} else {
					OptimizedNetwork optimizedNetwork = createOptimizedNetwork(networkAnalysis);
					final AnalysisNode analysisNode = optimizedNetwork
							.getAnalysisNode();

					log.trace("Analysis Node: {} {} {} {}", analysisNode
							.getFiberCoverage().getAtomicUnits(), analysisNode
							.getCapex(), analysisNode.getSuccessBasedCapex(),
							analysisNode.getFiberCoverage().getAtomicUnits());

					boolean isAnalysisEmpty = analysisNode.getFiberCoverage()
							.getLocations().isEmpty();
					if (isAnalysisEmpty) {
						optimized = true;
					} else if (constraintSatisfiedPredicate.test(networkAnalysis)) {
						if (resultAssembler.isEmpty()) {
							resultAssembler.add(optimizedNetwork);
						}
						optimized = true;
					} else {
						// The optimizer is only able to persist network changes
						// that result from a location being removed (rejected)
						// from the plan.
						// Filter out all other types of optimizations until the
						// persistence layer can be changed

						if (candiatePlanPredicate.test(optimizedNetwork)
								&& verifyDifferentNetwork
										.isDifferent(optimizedNetwork)) {
							resultAssembler.add(optimizedNetwork);
						}

						if (log.isTraceEnabled()) {
							log.trace("prune ..."
									+ networkAnalysis.getAnalyisNode()
											.getScore());
						}

						// TODO after adding support of multiple fiber sources.
						// maybe
						// USE GeneratingNode::isValueNode or get rid of it

						GeneratingNode node = networkAnalysis
								.getMinimumNode(pruneCandidatePredicate);

						if (node == null) {
							optimized = true;
						} else {
							node.remove();
						}
					}
				}
			}
		}

		return resultAssembler.assemble();

	}

	private OptimizedNetwork createOptimizedNetwork(
			NetworkAnalysis networkAnalysis) {

		return new LazyOptimizedNetwork(new AnalysisNodeImpl(
				networkAnalysis.getAnalyisNode()),
				networkAnalysis.lazySerialize());

		// return new OptimizedNetworkImpl(networkAnalysis.createNetworkModel(),
		// new AnalysisNodeImpl(networkAnalysis.getAnalyisNode()));
	}

	private static class ResultAssembler {

		private List<OptimizedNetwork> result = new ArrayList<OptimizedNetwork>();

		public ResultAssembler() {
			super();
		}

		public void add(OptimizedNetwork network) {
			result.add(network);
		}

		public boolean isEmpty() {
			return result.isEmpty();
		}

		private OptimizedNetwork createEmptyNetwork() {
			return new LazyOptimizedNetwork(AnalysisNodeImpl.ZERO_IDENTITY,
					EmptyNetworkGenerator.GENERATOR);
		}

		public List<OptimizedNetwork> assemble() {
			if (result.isEmpty()) {
				result.add(createEmptyNetwork());
			}
			return result;
		}

	}

	public static class EmptyNetworkGenerator implements NetworkGenerator {

		public static final NetworkGenerator GENERATOR = new EmptyNetworkGenerator();

		@Override
		public Optional<CompositeNetworkModel> get(ApplicationContext ctx) {
			return Optional.of(EmptyCompositeNetworkModel.MODEL);
		}

		@Override
		public boolean matches(NetworkGenerator other) {
			if (other instanceof EmptyNetworkGenerator) {
				return true;
			}
			return false;
		}

	}

	public static class EmptyCompositeNetworkModel implements
			CompositeNetworkModel, Serializable {

		/**
		 *
		 */
		private static final long serialVersionUID = 1L;
		public static CompositeNetworkModel MODEL = new EmptyCompositeNetworkModel();

		@Override
		public NetworkModel getNetworkModel(NetworkAssignment networkAssignment) {
			return null;
		}

		@Override
		public Collection<NetworkModel> getNetworkModels() {
			return Collections.emptyList();
		}
	}

	private static class VerifyDifferentNetwork {
		private OptimizedNetwork lastNetwork = null;

		public boolean isDifferent(OptimizedNetwork t) {
			boolean different = (lastNetwork == null || !t.matches(lastNetwork));
			lastNetwork = t;
			return different;
		}
	}

}
