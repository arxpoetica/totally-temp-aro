package com.altvil.aro.service.optimize.spi;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.function.Predicate;

import com.altvil.aro.service.optimize.OptimizedNetwork;
import com.altvil.aro.service.optimize.impl.AnalysisNodeImpl;
import com.altvil.aro.service.optimize.impl.LazyOptimizedNetwork;
import com.altvil.aro.service.optimize.model.GeneratingNode;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;

public class NetworkConstrainer {

	private NetworkModelBuilder networkModelBuilder;
	private Predicate<GeneratingNode> generatingNodeConstraint;
	private Predicate<NetworkAnalysis> constraintMatcher;
	private NetworkAnalysis networkAnalysis;

	private NetworkConstrainer(NetworkModelBuilder networkModelBuilder,
			Predicate<GeneratingNode> generatingNodeConstraint,
			Predicate<NetworkAnalysis> constraintMatcher,
			NetworkAnalysis networkAnalysis) {
		super();
		this.networkModelBuilder = networkModelBuilder;
		this.generatingNodeConstraint = generatingNode -> !generatingNodeConstraint
				.test(generatingNode);
		this.networkAnalysis = networkAnalysis;
		this.constraintMatcher = constraintMatcher;
	}

	public static NetworkConstrainer create(
			NetworkModelBuilder networkModelBuilder,
			Predicate<GeneratingNode> generatingNodeConstraint,
			Predicate<NetworkAnalysis> constraintMatcher,
			NetworkAnalysis networkAnalysis) {
		return new NetworkConstrainer(networkModelBuilder,
				generatingNodeConstraint, constraintMatcher, networkAnalysis);
	}

	public List<OptimizedNetwork> constrainNetwork() {

		boolean constraintSatisfied = false;
		while (!constraintSatisfied) {
			// Establish CapexPerm Constraint
			GeneratingNode node = networkAnalysis
					.getMinimumNode(generatingNodeConstraint);
			if (node == null) {
				constraintSatisfied = true;
			} else {
				node.remove();
			}
		}

		ResultAssembler resultAssembler = new ResultAssembler(networkModelBuilder);

		boolean optimized = false;
		while (!optimized) {
			if (networkAnalysis == null
					|| networkAnalysis.getAnalyisNode() == null) {
				// Empty Delta

				optimized = true;
			} else {
				OptimizedNetwork optimizedNetwork = createOptimizedNetwork(networkAnalysis);
				boolean isAnalysisEmpty = optimizedNetwork.getAnalysisNode()
						.getFiberCoverage().getLocations().isEmpty();
				if (isAnalysisEmpty || constraintMatcher.test(networkAnalysis)) {
					if (resultAssembler.isEmpty() && !isAnalysisEmpty) {
						resultAssembler.add(optimizedNetwork);
					}
					optimized = true;
				} else {
					resultAssembler.add(optimizedNetwork);
					// TODO after adding support of multiple fiber soudes. maybe
					// USE GeneratingNode::isValueNode or get rid of it
					GeneratingNode node = networkAnalysis
							.getMinimumNode(generatingNode -> !(generatingNode.getEquipmentAssignment().isSourceEquipment() 
														|| generatingNode.getEquipmentAssignment().isRoot()));
					if (node == null) {
						optimized = true;
					} else {
						node.remove();
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
					() -> Optional.of(EmptyCompositeNetworkModel.MODEL),
					networkModelBuilder);
		}


		public List<OptimizedNetwork> assemble() {
			if (result.isEmpty()) {
				result.add(createEmptyNetwork()) ;
			}
			return result;
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
}
