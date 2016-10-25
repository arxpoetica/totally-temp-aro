package com.altvil.aro.service.optimization.wirecenter.tabc;

import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.function.Predicate;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WircenterOptimizationStrategy;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel.SelectionFilter;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.UnitUtils;

public class TabcOptimizationStrategy implements WircenterOptimizationStrategy {

	private WirecenterOptimizationRequest wirecenterOptimizationRequest;
	private Collection<String> strategies ;
	
	private WirecenterOptimizationService wirecenterOptimizationService;
	private NetworkDataService networkDataService;

	// Initially ALL Data = CellTowers + 2K data
	private NetworkDataHandler networkDataHandler;
	private Function<NetworkData, Optional<PlannedNetwork>> networkGenerator;

	private Collection<GenerationStrategy> generationStrategies;
	
	
	public void initialize(ApplicationContext appContext) {
		this.wirecenterOptimizationService = appContext.getBean(WirecenterOptimizationService.class) ;
		this.networkDataService = appContext.getBean(NetworkDataService.class) ;
		init(strategies);
	}

	private void init(Collection<String> strategies) {
		generationStrategies = createStrategyPlan(strategies);
		
		networkGenerator = wirecenterOptimizationService
				.bindRequest(wirecenterOptimizationRequest);
		
		NetworkDataRequest networkDataRequest = wirecenterOptimizationRequest
				.getNetworkDataRequest()
				.modify()
				.updateLocationTypes(
						EnumSet.of(LocationEntityType.celltower,
								LocationEntityType.large))
				.updateSelectionFilters(EnumSet.of(SelectionFilter.ALL))
				.updateMrc(2000)
				.update(AnalysisSelectionMode.SELECTED_AREAS).commit();

		this.networkDataHandler = new NetworkDataHandler(
				networkDataService.getNetworkData(networkDataRequest));

		
	}

	@Override
	public Optional<PlannedNetwork> optimize() {

		Optional<PlannedNetwork> network = null;
		for (GenerationStrategy strategy : generationStrategies) {
			network = strategy.generate(network);
		}

		return network;
	}

	private Collection<GenerationStrategy> createStrategyPlan(
			Collection<String> strategies) {
		return StreamUtil.map(strategies,
				s -> StrategyFactory.FACTORY.createStrategy(s, this));

	}

	private Predicate<NetworkAssignment> createNetworkAssignmentPredicate(
			Optional<PlannedNetwork> network, double bufferDistance) {
		return null;
	}

	
	private interface GenerationStrategy {
		String geId();

		Optional<PlannedNetwork> generate(Optional<PlannedNetwork> network);
	}

	private static class InitialTargetStratgey implements GenerationStrategy {

		private TabcOptimizationStrategy tabcOptimizationStrategy;
		private String id;
		private Predicate<NetworkAssignment> predicate;

		public InitialTargetStratgey(
				TabcOptimizationStrategy tabcOptimizationStrategy, String id,
				Predicate<NetworkAssignment> predicate) {
			super();
			this.tabcOptimizationStrategy = tabcOptimizationStrategy;
			this.id = id;
			this.predicate = predicate;
		}

		@Override
		public String geId() {
			return id;
		}

		@Override
		public Optional<PlannedNetwork> generate(
				Optional<PlannedNetwork> network) {
			return tabcOptimizationStrategy.networkGenerator
					.apply(tabcOptimizationStrategy.networkDataHandler
							.getNetworkData(predicate));
		}

	}

	private static class ExpansionStrategy implements GenerationStrategy {
		private TabcOptimizationStrategy tabcOptimization;
		private String id;
		private double bufferDistance;

		public ExpansionStrategy(TabcOptimizationStrategy tabcOptimization,
				String id, double bufferDistance) {
			super();
			this.tabcOptimization = tabcOptimization;
			this.id = id;
			this.bufferDistance = bufferDistance;
		}

		@Override
		public String geId() {
			return id;
		}

		@Override
		public Optional<PlannedNetwork> generate(Optional<PlannedNetwork> model) {

			NetworkData networkData = tabcOptimization.networkDataHandler
					.getNetworkData(tabcOptimization
							.createNetworkAssignmentPredicate(model,
									bufferDistance));

			return tabcOptimization.networkGenerator.apply(networkData);

		}

	}

	private static class NetworkDataHandler {
		private NetworkData networkData;

		public NetworkDataHandler(NetworkData networkData) {
			super();
			this.networkData = networkData;
		}

		public NetworkData getNetworkData(Predicate<NetworkAssignment> predicate) {
			return networkData.createNetworkData(networkData.getRoadLocations()
					.filter(predicate).create(SelectionFilter.ALL));
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

	private static class StrategyFactory {

		private Map<String, Function<TabcOptimizationStrategy, GenerationStrategy>> map = new HashMap<>();

		public static StrategyFactory FACTORY = new StrategyFactory();

		private StrategyFactory() {
			init();
		}

		private static Predicate<NetworkAssignment> createPredicate(
				LocationEntityType type) {

			return na -> {

				AroEntity aroEntity = na.getSource();

				if (aroEntity instanceof LocationEntity) {
					LocationEntity le = (LocationEntity) aroEntity;
					return le.getLocationDemand().getLocationDemand(type)
							.getAtomicUnits() > 0;
				}

				return false;
			};
		}

		private void init() {
			map.put("T", ctx -> new InitialTargetStratgey(ctx, "T",
					createPredicate(LocationEntityType.celltower)));

			map.put("A",
					ctx -> new ExpansionStrategy(ctx, "A", UnitUtils
							.toMetersFromMiles(0.25)));

			map.put("B",
					ctx -> new ExpansionStrategy(ctx, "B", UnitUtils
							.toMetersFromMiles(0.25)));

			map.put("C",
					ctx -> new ExpansionStrategy(ctx, "C", UnitUtils
							.toMetersFromMiles(0.5)));

		}

		public GenerationStrategy createStrategy(String strategyName,
				TabcOptimizationStrategy ctx) {
			return map.get(strategyName).apply(ctx);
		}

	}

}
