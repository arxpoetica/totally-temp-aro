package com.altvil.aro.service.optimization.factory.impl;



import java.util.Collection;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.springframework.context.ApplicationContext;

import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.factory.WireCenterPlanningStrategy;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedData;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedNetworkData;
import com.altvil.aro.service.optimization.wirecenter.generated.LinkedLocation;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultPlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.altvil.utils.BufferedGeographyMatcher;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.UnitUtils;
import com.vividsolutions.jts.geom.LineString;


public class TabcOptimizationStrategy implements WireCenterPlanningStrategy {

	

	private WirecenterOptimizationRequest wirecenterOptimizationRequest;
	private Collection<String> strategies;

	private WirecenterOptimizationService wirecenterOptimizationService;
	private NetworkDataService networkDataService;

	// Initially ALL Data = CellTowers + 2K data
	private NetworkDataHandler networkDataHandler;
	private Function<NetworkData, Optional<PlannedNetwork>> networkGenerator;

	private Collection<GenerationStrategy> generationStrategies;
	private GenerationTracker generationTracker;
	
	public TabcOptimizationStrategy(
			WirecenterOptimizationRequest wirecenterOptimizationRequest,
			Collection<String> strategies) {
		super();
		this.wirecenterOptimizationRequest = wirecenterOptimizationRequest;
		this.strategies = strategies;
	}

	public void initialize(ApplicationContext appContext) {
		this.wirecenterOptimizationService = appContext
				.getBean(WirecenterOptimizationService.class);
		this.networkDataService = appContext.getBean(NetworkDataService.class);

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
				.updateSelectionFilters(EnumSet.of(NetworkAssignmentModel.SelectionFilter.ALL))
				.updateMrc(2000).update(AnalysisSelectionMode.SELECTED_AREAS)
				.commit();

		this.networkDataHandler = new NetworkDataHandler(
				networkDataService.getNetworkData(networkDataRequest));

		this.generationTracker = new GenerationTracker();

	}

	@Override
	public Optional<PlannedNetwork> optimize() {

		Optional<PlannedNetwork> network = null;
		for (GenerationStrategy strategy : generationStrategies) {
			network = strategy.generate(network);
			generationTracker.update(strategy, network);
		}
		
		if( network.isPresent() ) {
			network = Optional.of(new DefaultPlannedNetwork(network.get(), generationTracker)) ;
		}

		return network;
	}

	
	private Predicate<NetworkAssignment> createNetworkAssignmentPredicate(
			Optional<PlannedNetwork> network, double bufferDistance) {
		if(!network.isPresent())
			return (assignment)-> false;

		CompositeNetworkModel plannedNetwork = network.get().getPlannedNetwork();
		Collection<LineString> geometries = plannedNetwork.getNetworkModels().stream()
				.map(NetworkModel::getCentralOfficeFeederFiber)
				.map(GeneratedFiberRoute::getEdges)
				.flatMap(Collection::stream)
				.map(geoSegmentAroEdge -> (LineString) geoSegmentAroEdge.getValue().getLineString())
				.collect(Collectors.toList());
		BufferedGeographyMatcher matcher = new BufferedGeographyMatcher(geometries, bufferDistance);

		Set<NetworkAssignment> assginmentsWithinDistance = 
				networkData.getRoadLocations().getDefaultAssignments()
				.stream()
				.filter(assignment -> matcher.covers(assignment.getDomain().getLocationPoint()))
				.collect(Collectors.toSet());

		return assginmentsWithinDistance::contains;

	}
	
	
	private Collection<GenerationStrategy> createStrategyPlan(
			Collection<String> strategies) {
		return StreamUtil.map(strategies,
				s -> StrategyFactory.FACTORY.createStrategy(s, this));

	}

	private NetworkData getNetworkData(GenerationStrategy strategy,
									   Predicate<NetworkAssignment> predicate) {
		NetworkData networkData = networkDataHandler.getNetworkData(predicate);
		generationTracker.update(strategy, networkData);
		return networkData;
	}
	


	private interface GenerationStrategy {
		String getId();

		Optional<PlannedNetwork> generate(Optional<PlannedNetwork> network);
	}

	private static class InitialTargetStrategy implements GenerationStrategy {

		private TabcOptimizationStrategy tabcOptimizationStrategy;
		private String id;
		private Predicate<NetworkAssignment> predicate;

		public InitialTargetStrategy(
				TabcOptimizationStrategy tabcOptimizationStrategy, String id,
				Predicate<NetworkAssignment> predicate) {
			super();
			this.tabcOptimizationStrategy = tabcOptimizationStrategy;
			this.id = id;
			this.predicate = predicate;
		}

		@Override
		public String getId() {
			return id;
		}

		@Override
		public Optional<PlannedNetwork> generate(
				Optional<PlannedNetwork> network) {
			return tabcOptimizationStrategy.networkGenerator
					.apply(tabcOptimizationStrategy.getNetworkData(this,
							predicate));
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
		public String getId() {
			return id;
		}

		@Override
		public Optional<PlannedNetwork> generate(Optional<PlannedNetwork> model) {

			NetworkData networkData = tabcOptimization.getNetworkData(this,
					tabcOptimization.createNetworkAssignmentPredicate(model,
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

		private NetworkData getNetworkData(
				Predicate<NetworkAssignment> predicate) {
			return networkData.createNetworkData(networkData.getRoadLocations()
					.filter(predicate).create(NetworkAssignmentModel.SelectionFilter.ALL));
		}

	}

	private static class LocationTracking implements LinkedLocation {
		private NetworkAssignment networkAssignment;
		private StringBuffer trackingStrategy = new StringBuffer();

		public LocationTracking(NetworkAssignment networkAssignment) {
			super();
			this.networkAssignment = networkAssignment;
		}

		public void update(GenerationStrategy strategy) {
			this.trackingStrategy.append(strategy.getId());
		}

		@Override
		public Long getLocationId() {
			return networkAssignment.getSource().getObjectId() ;
		}

		@Override
		public AssignedEntityDemand getAssignedEntityDemand() {
			// TODO Auto-generated method stub
			return null;
		}

		@Override
		public LinkType getLinkType() {
			return LinkType.LINKED;
		}

		@Override
		public String getExtendedInfo() {
			return trackingStrategy.toString();
		}

	}

	private class GenerationTracker implements GeneratedData {

		private Map<NetworkAssignment, LinkedLocation> map = new HashMap<>(
				10000);

		public void update(GenerationStrategy strategy, NetworkData networkData) {

			networkData.roadLocations.getDefaultAssignments().forEach(na -> {
				LocationTracking lt = (LocationTracking)  map.get(na);

				if (lt == null) {
					map.put(na, lt = new LocationTracking(na));
				}

				lt.update(strategy);

			});
		}
		
		@Override
		public Collection<LinkedLocation> getLinkedLocations() {
			return map.values();
		}



		@Override
		public Collection<GeneratedNetworkData> getGeneratedNetworkData() {
			//track generated tacking
			return Collections.emptyList() ;
		}



		public void update(GenerationStrategy strategy,
				Optional<PlannedNetwork> networkModel) { 
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
			map.put("T", ctx -> new InitialTargetStrategy(ctx, "T",
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
