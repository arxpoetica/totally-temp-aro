package com.altvil.aro.service.optimization.factory.impl;

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
import java.util.function.Supplier;
import java.util.stream.Collectors;

import com.altvil.utils.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationContext;

import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.AssignedEntityDemand;
import com.altvil.aro.service.entity.BulkFiberTerminal;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.EquipmentLinker;
import com.altvil.aro.service.entity.FDTEquipment;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.graph.AroEdge;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.segment.GeoSegment;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.optimization.factory.WireCenterPlanningStrategy;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.aro.service.optimization.wirecenter.generated.EquipmentLinkedLocation;
import com.altvil.aro.service.optimization.wirecenter.generated.EquipmentLinkedLocation.LinkType;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedData;
import com.altvil.aro.service.optimization.wirecenter.generated.GeneratedNetworkData;
import com.altvil.aro.service.optimization.wirecenter.generatedmpl.i.GeneratedNetworkDataImpl;
import com.altvil.aro.service.optimization.wirecenter.impl.DefaultPlannedNetwork;
import com.altvil.aro.service.plan.CompositeNetworkModel;
import com.altvil.aro.service.plan.GeneratedFiberRoute;
import com.altvil.aro.service.plan.NetworkModel;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.MultiLineString;

public class TabcOptimizationStrategy implements WireCenterPlanningStrategy {

	private static final Logger log = LoggerFactory
			.getLogger(TabcOptimizationStrategy.class.getName());

	private static InternedSet<NetworkNodeType> internedSet = InternedSet
			.create(NetworkNodeType.class);

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
				.updateSelectionFilters(
						EnumSet.of(NetworkAssignmentModel.SelectionFilter.ALL))
				.updateMrc(0).update(AnalysisSelectionMode.SELECTED_AREAS)
				.commit();

		this.networkDataHandler = new NetworkDataHandler(
				networkDataService.getNetworkData(networkDataRequest));

		this.generationTracker = new GenerationTracker();

	}

	@Override
	public Optional<PlannedNetwork> optimize() {

		Optional<PlannedNetwork> network = Optional.empty();
		for (GenerationStrategy strategy : generationStrategies) {
			network = strategy.generate(network);
			generationTracker.update(strategy, network);
		}

		if (network.isPresent()) {
			network = Optional.of(new DefaultPlannedNetwork(network.get(),
					generationTracker));
		}

		return network;
	}

	private Predicate<NetworkAssignment> createNetworkAssignmentPredicate(
			Optional<PlannedNetwork> network, double bufferDistance) {

		if (!network.isPresent()) {
			return (assignment) -> false;
		}

		CompositeNetworkModel plannedNetwork = network.get()
				.getPlannedNetwork();
		Collection<Geometry> geometries = plannedNetwork
				.getNetworkModels()
				.stream()
				// TODO: add distribution fiber handling
				.map(NetworkModel::getCentralOfficeFeederFiber)
				.map(GeneratedFiberRoute::getEdges)
				.flatMap(Collection::stream)
				.map(geoSegmentAroEdge -> geoSegmentAroEdge.getValue()
						.getLineString()).collect(Collectors.toList());

		BufferedSTRGeographyMatcher matcher = new BufferedSTRGeographyMatcher(
				geometries, bufferDistance);
		return assignment -> matcher.covers(assignment.getDomain()
				.getLocationPoint());
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
					.filter(predicate)
					.create(NetworkAssignmentModel.SelectionFilter.ALL));
		}

	}

	private static class ProxyEquipmentLinkedLocation implements
			EquipmentLinkedLocation {

		private LocationEntityType locationEntityType;
		private LocationTracking locationTracking;
		private DemandStatistic demandStatistic;

		public ProxyEquipmentLinkedLocation(
				LocationEntityType locationEntityType,
				LocationTracking locationTracking,
				DemandStatistic demandStatistic) {
			super();
			this.locationEntityType = locationEntityType;
			this.locationTracking = locationTracking;
			this.demandStatistic = demandStatistic;
		}

		@Override
		public Long getLocationId() {
			return locationTracking.getLocationId();
		}

		@Override
		public LinkType getLinkType() {
			return locationTracking.getLinkType();
		}

		@Override
		public LocationEntityType getLocationEntityType() {
			return locationEntityType;
		}

		@Override
		public DemandStatistic getDemandStatistic() {
			return demandStatistic;
		}

		@Override
		public String getExtendedInfo() {
			return locationTracking.getExtendedInfo();
		}

	}

	private static class LocationTracking {
		private NetworkAssignment networkAssignment;
		private StringBuffer trackingStrategy = new StringBuffer();
		private Set<NetworkNodeType> networkLinkTypes = internedSet
				.getEmptySet();
		private LinkType linkType = LinkType.LINKED;

		public LocationTracking(NetworkAssignment networkAssignment) {
			super();
			this.networkAssignment = networkAssignment;
		}

		public void assemble(List<EquipmentLinkedLocation> linkedLocations) {
			LocationDemand ld = getLocationEntity().getLocationDemand();
			ld.getEntityDemands()
					.entrySet()
					.stream()
					.filter(e -> e.getValue().getAtomicUnits() > 0)
					.map(e -> {
						return (EquipmentLinkedLocation) new ProxyEquipmentLinkedLocation(
								e.getKey(), this, e.getValue());
					}).forEach(ll -> linkedLocations.add(ll));

		}

		public void update(GenerationStrategy strategy) {
			this.trackingStrategy.append(strategy.getId());
		}

		public Long getLocationId() {
			return getLocationEntity().getObjectId();
		}

		public void update(GenerationStrategy strategy,
				AssignedEntityDemand assignedDemand, NetworkNodeType nodeType) {
			trackingStrategy.append(strategy.getId());
			internedSet.append(networkLinkTypes, nodeType);
		}

		public LocationEntity getLocationEntity() {
			return (LocationEntity) networkAssignment.getSource();
		}

		public LinkType getLinkType() {
			return linkType;
		}

		public String getExtendedInfo() {
			return trackingStrategy.toString();
		}

	}

	private class GenerationTracker implements GeneratedData {

		private Map<Long, LocationTracking> map = new HashMap<>(10000);
		private List<GeneratedNetworkData> generatedData = new ArrayList<>();

		public void update(GenerationStrategy strategy, NetworkData networkData) {

			networkData.roadLocations.getDefaultAssignments().forEach(na -> {
				LocationTracking lt = map.get(na.getSource().getObjectId());

				if (lt == null) {
					lt = new LocationTracking(na);
					map.put(lt.getLocationId(), lt);
				}

				lt.update(strategy);

			});
		}

		@Override
		public Collection<EquipmentLinkedLocation> getLinkedLocations() {
			List<EquipmentLinkedLocation> result = new ArrayList<>();
			map.values().forEach(l -> l.assemble(result));
			return result;
		}

		private MultiLineString createMultiLineString(
				Collection<AroEdge<GeoSegment>> segments) {

			return GeometryUtil.createMultiLineString(StreamUtil.map(segments,
					s -> (LineString) s.getValue().getLineString()));
		}

		private NetworkNodeType toEquipmentNodeType(EquipmentLinker linker) {
			Class<?> clz = linker.getType();
			if (BulkFiberTerminal.class.isAssignableFrom(clz)) {
				return NetworkNodeType.bulk_distrubution_terminal;
			}
			if (FDTEquipment.class.isAssignableFrom(clz)) {
				return NetworkNodeType.fiber_distribution_hub;
			}

			throw new RuntimeException("Unknown EquipmentLinker Type " + clz);
		}

		private void updateRejectedLinks(GenerationStrategy strategy,
				EquipmentLinker linker) {
			NetworkNodeType nt = toEquipmentNodeType(linker);
			linker.getAssignedDemands()
					.forEach(
							ad -> {
								Long locationId = ad.getLocationEntity()
										.getObjectId();
								LocationTracking lt = (LocationTracking) map
										.get(locationId);
								if (lt == null) {
									log.error("Failed to map LocationTracking location id ="
											+ locationId);
								} else {
									lt.update(strategy, ad, nt);
								}

							});
		}

		private void updateFiberPath(GenerationStrategy strategy,
				CompositeNetworkModel network) {

			// TODO Add distribution Fiber
			Geometry geometry = createMultiLineString(network
					.getNetworkModels()
					.stream()
					.flatMap(
							nm -> nm.getCentralOfficeFeederFiber().getEdges()
									.stream()).collect(Collectors.toList()));

			generatedData.add(new GeneratedNetworkDataImpl("fiber_route_"
					+ strategy.getId(), geometry));

		}

		private void updateNetwork(GenerationStrategy strategy,
				CompositeNetworkModel network) {

			updateFiberPath(strategy, network);
			network.getNetworkModels().stream()
					.flatMap(nm -> nm.getRejectedEquipmentLinkers().stream())
					.forEach(linker -> updateRejectedLinks(strategy, linker));
		}

		public void update(GenerationStrategy strategy,
				Optional<PlannedNetwork> networkModel) {
			if (networkModel.isPresent()) {
				updateNetwork(strategy, networkModel.get().getPlannedNetwork());
			}
		}

		@Override
		public Collection<GeneratedNetworkData> getGeneratedNetworkData() {
			return generatedData;
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

	private static class InternedSet<T> {

		public static <T extends Enum<T>> InternedSet<T> create(Class<T> clz) {
			return new InternedSet<T>(() -> EnumSet.noneOf(clz));
		}

		private Supplier<Set<T>> setSupplier;
		private Map<Set<T>, Set<T>> map = new HashMap<>();
		private final Set<T> emptySet;

		public InternedSet(Supplier<Set<T>> setSupplier) {
			super();
			this.setSupplier = setSupplier;
			emptySet = setSupplier.get();
			map.put(emptySet, emptySet);
		}

		public Set<T> getEmptySet() {
			return emptySet;
		}

		public Set<T> append(Set<T> set, T value) {
			Set<T> updatedSet = setSupplier.get();
			updatedSet.addAll(set);

			Set<T> interned = map.get(updatedSet);
			if (interned == null) {
				map.put(updatedSet, interned = updatedSet);
			}

			return interned;
		}

	}

}
