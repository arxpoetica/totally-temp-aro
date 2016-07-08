package com.altvil.aro.service.optimize.spi;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

	private NetworkModelBuilder networkModelBuilder;
	private PruningStrategy pruningStrategy;
	private NetworkAnalysis networkAnalysis;

	private NetworkConstrainer(NetworkModelBuilder networkModelBuilder,
			PruningStrategy pruningStrategy, NetworkAnalysis networkAnalysis) {
		super();
		this.networkModelBuilder = networkModelBuilder;
		this.pruningStrategy = pruningStrategy;
		this.networkAnalysis = networkAnalysis;

	}

	public static NetworkConstrainer create(
			NetworkModelBuilder networkModelBuilder,
			PruningStrategy pruningStrategy, NetworkAnalysis networkAnalysis) {
		return new NetworkConstrainer(networkModelBuilder, pruningStrategy,
				networkAnalysis);
	}

	public List<OptimizedNetwork> constrainNetwork() {
		ResultAssembler resultAssembler = new ResultAssembler(
				networkModelBuilder);
		if (networkAnalysis != null) {
			{
				// Remove nodes that do not satisfy the generating node
				// constraint. Nodes are removed from least desirable to most
				// with the score (desirability) of the remaining nodes
				// recalculated each time the least desirable node is removed.
				GeneratingNode node;

				while ((node = networkAnalysis
						.getMinimumNode(gn -> !pruningStrategy
								.isGeneratingNodeValid(gn))) != null) {
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
							analysisNode.getFiberCoverage().getRawCoverage());

					boolean isAnalysisEmpty = analysisNode.getFiberCoverage()
							.getLocations().isEmpty();
					if (isAnalysisEmpty) {
						optimized = true;
					} else if (pruningStrategy
							.isConstraintSatisfied(networkAnalysis)) {
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

						if (pruningStrategy
								.isCandidatePlan(optimizedNetwork)
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
								.getMinimumNode(generatingNode -> !(generatingNode
										.isSourceEquipment()));

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
				networkAnalysis.lazySerialize(), networkModelBuilder);

		// return new OptimizedNetworkImpl(networkAnalysis.createNetworkModel(),
		// new AnalysisNodeImpl(networkAnalysis.getAnalyisNode()));
	}

	private static class ResultAssembler {

		private NetworkModelBuilder networkModelBuilder;

		private List<OptimizedNetwork> result = new ArrayList<OptimizedNetwork>();

		public ResultAssembler(NetworkModelBuilder networkModelBuilder) {
			super();
			this.networkModelBuilder = networkModelBuilder;
		}

		public void add(OptimizedNetwork network) {
			result.add(network);
		}

		public boolean isEmpty() {
			return result.isEmpty();
		}

		private OptimizedNetwork createEmptyNetwork() {
			return new LazyOptimizedNetwork(AnalysisNodeImpl.ZERO_IDENTITY,
					EmptyNetworkGenerator.GENERATOR, networkModelBuilder);
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
		public Optional<CompositeNetworkModel> get() {
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
