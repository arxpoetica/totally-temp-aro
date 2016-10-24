package com.altvil.aro.service.optimization.wirecenter.tabc;

import java.util.Collection;
import java.util.Optional;
import java.util.Set;
import java.util.function.Predicate;

import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WircenterOptimizationStrategy;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService;
import com.altvil.aro.service.plan.CoreLeastCostRoutingService.LcrContext;
import com.altvil.interfaces.NetworkAssignment;

public class TabcOptimizationStrategy implements WircenterOptimizationStrategy {

	private WirecenterOptimizationRequest wirecenterOptimizationRequest;

	private LcrContext lcrContext;
	private CoreLeastCostRoutingService coreLeastRoutingService;
	private WirecenterOptimizationService wirecenterOptimizationService;

	//Initially ALL Data = CellTowers + 2K data
	private NetworkData networkData;

	private Collection<GenerationStrategy> generationStrategies;

	@Override
	public Optional<PlannedNetwork> optimize() {

		CompositeNetworkModel model = null;
		for (GenerationStrategy strategy : createStrategyPlan()) {
			model = strategy.evaluate(model);
		}

		// T Select Towers (Constraint)
		// Load all Locations

		// A :- select targets including towers
		// Direct Routing

		// B :- select targets including towers
		// Direct Routing

		// C :- select targets including towers
		// Direct Routing

		return null;
	}

	private Collection<GenerationStrategy> createStrategyPlan() {
		return null;
	}

	private Predicate<NetworkAssignment> createNetworkAssignmentPredicate(
			CompositeNetworkModel network, double bufferDistance) {
		return null;
	}

	
	private NetworkData createNetworkData(Predicate<NetworkAssignment> predicate) {
		return null;
	}

	private interface GenerationStrategy {
		String geId();

		CompositeNetworkModel evaluate(CompositeNetworkModel model);
	}

	private class InitialTargetStratgey implements GenerationStrategy {
		@Override
		public String geId() {
			return null;
		}

		@Override
		public CompositeNetworkModel evaluate(CompositeNetworkModel model) {

			//NetworkData (selected) = towers
			// Select Towers

			return null;
		}

	}

	private class ExpansionStrategy implements GenerationStrategy {
		private String id;
		private double bufferDistance;

		@Override
		public String geId() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public CompositeNetworkModel evaluate(CompositeNetworkModel model) {
			
			NetworkData nd = createNetworkData(createNetworkAssignmentPredicate(
					model, bufferDistance));

			//NetworkData (selected) = targetSelector(model) ;
			
			// Update Generation Tracker = f()

			Optional<PlannedNetwork> network = wirecenterOptimizationService
					.planNetwork(wirecenterOptimizationRequest, nd);

			return null;
		}

	}

	private class TargetSelector {
		// Tracks ABC

		public Set<NetworkAssignment> computeNetworkAssignments(String id,
				PlannedNetwork network, double buffer) {

			if (network == null) {
				return null; // Towers
			}

			// buffer = f(size, network)
			// () -> predicate -> set<networkassignment>
			return null;
		}

	}

	private class GenerationTracker {

		public void update(GenerationStrategy strategy,
				Collection<NetworkAssignment> assignments) {

		}

		public void update(GenerationStrategy strategy,
				CompositeNetworkModel networkModel) {
		}

	}

}
