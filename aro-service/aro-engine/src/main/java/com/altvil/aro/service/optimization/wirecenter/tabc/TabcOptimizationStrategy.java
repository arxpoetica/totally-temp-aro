package com.altvil.aro.service.optimization.wirecenter.tabc;



import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import org.opengis.referencing.operation.MathTransform;
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
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.altvil.utils.GeometryUtil;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.UnitUtils;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;
import com.vividsolutions.jts.geom.prep.PreparedGeometry;
import com.vividsolutions.jts.geom.prep.PreparedGeometryFactory;


public class TabcOptimizationStrategy implements WircenterOptimizationStrategy {

	

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
			WirecenterOptimizationRequest wirecenterOptimizationRequest) {
		super();
		this.wirecenterOptimizationRequest = wirecenterOptimizationRequest;
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

		return network;
	}

	
	private Predicate<NetworkAssignment> createNetworkAssignmentPredicate(
			CompositeNetworkModel network, double bufferDistance) {
	
		Collection<LineString> geometries = network.getNetworkModels().stream()
				.map(NetworkModel::getCentralOfficeFeederFiber)
				.map(GeneratedFiberRoute::getEdges)
				.flatMap(Collection::stream)
				.map(geoSegmentAroEdge -> (LineString) geoSegmentAroEdge.getValue().getLineString())
				.collect(Collectors.toList());
		
		MultiLineString routeGeom= GeometryUtil.createMultiLineString(geometries);
		MathTransform transform = GeometryUtil.getGeographyTransform(routeGeom.getCentroid());
		MultiLineString routeGeography = GeometryUtil.transformGeometry(transform, routeGeom);

		PreparedGeometry preparedRouteBuffer = PreparedGeometryFactory.prepare(routeGeography.buffer(bufferDistance));

		Set<NetworkAssignment> assginmentsWithinDistance = networkData.getRoadLocations().getDefaultAssignments()
				.stream()
				.filter(assignment -> preparedRouteBuffer.contains(GeometryUtil.transformGeometry(transform, assignment.getDomain().getLocationPoint())))
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
	

	private Predicate<NetworkAssignment> createNetworkAssignmentPredicate(
			Optional<PlannedNetwork> network, double bufferDistance) {
		return null;
	}

	private interface GenerationStrategy {
		String geId();

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
		public String geId() {
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
		public String geId() {
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

	private static class LocationTracking {
		@SuppressWarnings("unused")
		private NetworkAssignment networkAssignment;
		private List<GenerationStrategy> trackingStrategy = new ArrayList<>(3);

		public LocationTracking(NetworkAssignment networkAssignment) {
			super();
			this.networkAssignment = networkAssignment;
		}

		public void update(GenerationStrategy strategy) {
			this.trackingStrategy.add(strategy);
		}

	}

	private class GenerationTracker {

		private Map<NetworkAssignment, LocationTracking> map = new HashMap<>(
				10000);

		public void update(GenerationStrategy strategy, NetworkData networkData) {

			networkData.roadLocations.getDefaultAssignments().forEach(na -> {
				LocationTracking lt = map.get(na);

				if (lt == null) {
					map.put(na, lt = new LocationTracking(na));
				}

				lt.update(strategy);

			});
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
