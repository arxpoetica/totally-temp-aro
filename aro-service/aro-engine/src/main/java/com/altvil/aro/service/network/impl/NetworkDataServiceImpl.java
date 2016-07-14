package com.altvil.aro.service.network.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.DemandMapping;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.graph.model.LocationDemandAnalysis;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;
import com.altvil.utils.func.Aggregator;

@Service
public class NetworkDataServiceImpl implements NetworkDataService {

	private static final Logger LOG = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());

	@Autowired
	private NetworkPlanRepository planRepository;

	@Autowired
	private AroDemandService aroDemandService;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	@Override
	public NetworkData getNetworkData(NetworkDataRequest request) {

		NetworkData networkData = new NetworkData();

		Map<Long, LocationDemandMapping> demandByLocationIdMap = getLocationDemand(request);

		networkData.setDemandAnalysis(new LocationDemandAnalysisImpl(
				demandByLocationIdMap,
				toFullShare(aggregate(demandByLocationIdMap.values()))));

		// TODO Simplify Locations
		Collection<NetworkAssignment> roadLocations = getNetworkLocations(
				request, demandByLocationIdMap);

		networkData.setRoadLocations(roadLocations);

		networkData
				.setSelectedRoadLocationIds(toSelectedRoadLocationIds(roadLocations));

		networkData.setFiberSources(getFiberSourceNetworkAssignments(request));
		networkData.setRoadEdges(getRoadEdges(request));

		return networkData;
	}

	private LocationDemandMapping aggregate(
			Collection<LocationDemandMapping> demandMapping) {

		Aggregator<LocationDemandMapping> aggreagtor = LocationDemandMapping
				.aggregate();
		demandMapping.forEach(aggreagtor::add);
		return aggreagtor.apply();

	}

	private LocationDemand toFullShare(LocationDemandMapping mapping) {
		return aroDemandService.createFullShareDemand(mapping);
	}

	private Collection<Long> toSelectedRoadLocationIds(
			Collection<NetworkAssignment> locations) {
		return StreamUtil.map(locations, l -> l.getSource().getObjectId());
	}

	private Collection<NetworkAssignment> getNetworkLocations(
			NetworkDataRequest request,
			Map<Long, LocationDemandMapping> demandByLocationIdMap) {

		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(request);

		List<Long> selectedRoadLocations = selectedRoadLocationIds(
				request.getPlanId(), roadLocationByLocationIdMap);

		if (request.getSelectionMode() == LocationSelectionMode.SELECTED_LOCATIONS) {
			roadLocationByLocationIdMap.keySet().retainAll(
					selectedRoadLocations);
		}

		return toValidAssignments(roadLocationByLocationIdMap
				.keySet()
				.stream()
				.map(result -> {
					Long locationId = result;

					LocationDemandMapping ldm = demandByLocationIdMap
							.get(locationId);
					if (ldm == null || ldm.isEmpty()) {
						// No Demand no location mapped in for fiber Linking
						return null;
					}

					LocationDemand locationDemand = aroDemandService
							.createDemandByCensusBlock(ldm.getBlockId(), ldm,
									SpeedCategory.cat7);

					AroEntity aroEntity = entityFactory.createLocationEntity(
							request.getLocationEntities(), locationId,
							ldm.getBlockId(), locationDemand);

					return new DefaultNetworkAssignment(aroEntity,
							roadLocationByLocationIdMap.get(locationId));
				}));
	}

	public NetworkData _getNetworkData(NetworkDataRequest networkConfiguration) {
		// final long planId = networkConfiguration.getPlanId();
		NetworkData networkData = new NetworkData();

		Map<Long, LocationDemandMapping> demandByLocationIdMap = getLocationDemand(networkConfiguration);
		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(networkConfiguration);
		List<Long> selectedRoadLocations = selectedRoadLocationIds(
				networkConfiguration.getPlanId(), roadLocationByLocationIdMap);

		networkData
				.setFiberSources(getFiberSourceNetworkAssignments(networkConfiguration));

		if (networkConfiguration.getSelectionMode() == LocationSelectionMode.SELECTED_LOCATIONS) {
			roadLocationByLocationIdMap.keySet().retainAll(
					selectedRoadLocations);
		}

		Collection<NetworkAssignment> roadLocations = toValidAssignments(roadLocationByLocationIdMap
				.keySet()
				.stream()
				.map(result -> {
					Long locationId = result;

					LocationDemandMapping ldm = demandByLocationIdMap
							.get(locationId);
					if (ldm == null || ldm.isEmpty()) {
						// No Demand no location mapped in for fiber Linking
						return null;
					}

					LocationDemand locationDemand = aroDemandService
							.createDemandByCensusBlock(ldm.getBlockId(), ldm,
									SpeedCategory.cat7);

					AroEntity aroEntity = entityFactory.createLocationEntity(
							networkConfiguration.getLocationEntities(),
							locationId, ldm.getBlockId(), locationDemand);

					return new DefaultNetworkAssignment(aroEntity,
							roadLocationByLocationIdMap.get(locationId));
				}));

		networkData.setRoadLocations(roadLocations);

		networkData.setRoadEdges(getRoadEdges(networkConfiguration));
		networkData.setSelectedRoadLocationIds(selectedRoadLocations);

		return networkData;
	}

	private Collection<NetworkAssignment> toValidAssignments(
			Stream<NetworkAssignment> stream) {
		return stream.filter((na) -> na != null).collect(Collectors.toList());
	}

	private enum LocationMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance
	}

	private Map<Long, LocationDemandMapping> getLocationDemand(
			NetworkDataRequest networkConfiguration) {

		return queryLocationDemand(
				networkConfiguration.getSelectionMode() == LocationSelectionMode.SELECTED_LOCATIONS,
				networkConfiguration.getLocationEntities(),
				networkConfiguration.getPlanId(),
				networkConfiguration.getYear());

	}

	private enum EntityDemandMap implements OrdinalAccessor {
		location_id, block_id, entity_type, count, monthly_spend
	}

	private LocationEntityType toLocationEntityType(int entityTypeCode) {
		return LocationEntityTypeMapping.MAPPING
				.toLocationEntityType(entityTypeCode);
	}

	// private static EntityDe
	private Map<Long, LocationDemandMapping> assembleMapping(
			List<Object[]> entityDemands, Set<LocationEntityType> selectedTypes) {
		Map<Long, LocationDemandMapping> map = new HashMap<>();

		entityDemands
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.forEach(
						d -> {
							Long locationId = d
									.getLong(EntityDemandMap.location_id);
							LocationDemandMapping ldm = map.get(locationId);
							if (ldm == null) {
								map.put(locationId,
										ldm = new LocationDemandMapping(
												d.getInteger(EntityDemandMap.block_id)));
							}

							LocationEntityType lt = toLocationEntityType(d
									.getInteger(EntityDemandMap.entity_type));

							if (selectedTypes.contains(lt)) {
								ldm.add(lt,
										d.getDouble(EntityDemandMap.count),
										d.getDouble(EntityDemandMap.monthly_spend));
							}

						});

		return map;
	}

	private Map<Long, LocationDemandMapping> queryLocationDemand(
			boolean isFilteringRoadLocationDemandsBySelection,
			Set<LocationEntityType> selectedTypes, long planId, int year) {

		return assembleMapping(
				(isFilteringRoadLocationDemandsBySelection ? planRepository.queryFiberDemand(
						planId, year)
						: planRepository.queryAllFiberDemand(planId, year)),
				selectedTypes);

	}

	// private Long getWirecenterIdByPlanId(long planId) {
	// return planRepository.queryWirecenterIdForPlanId(planId);
	// }

	private Map<Long, RoadLocation> queryRoadLocations(long planId) {
		Map<Long, RoadLocation> roadLocationsMap = new HashMap<>();
		planRepository
				.queryAllLocationsByPlanId(planId)
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.forEach(
						result -> {
							long tlid = result.getLong(LocationMap.tlid);
							Long locationId = result.getLong(LocationMap.id);
							try {
								RoadLocation rl = RoadLocationImpl
										.build()
										.setTlid(tlid)
										.setLocationPoint(
												result.getPoint(LocationMap.point))
										.setRoadSegmentPositionRatio(
												result.getDouble(LocationMap.ratio))
										.setRoadSegmentClosestPoint(
												result.getPoint(LocationMap.intersect_point))
										.setDistanceFromRoadSegmentInMeters(
												result.getDouble(LocationMap.distance))
										.build(); // TODO
													// why
													// build()
													// twice?
													// does
													// second
													// produce
													// a
													// deep
													// clone?

								roadLocationsMap.put(locationId, rl);
							} catch (Throwable err) {
								LOG.error(
										"Failed creating RoadLocation for locationId "
												+ locationId + " due to: "
												+ err.getMessage(), err);
							}
						});
		return roadLocationsMap;
	}

	private Map<Long, RoadLocation> getRoadLocationNetworkLocations(
			NetworkDataRequest networkConfiguration) {
		return queryRoadLocations(networkConfiguration.getPlanId());
	}

	private List<Long> selectedRoadLocationIds(long planId,
			Map<Long, RoadLocation> roadLocationByLocationIdMap) {
		List<Long> selectedRoadLocations = planRepository
				.querySelectedLocationsByPlanId(planId).stream()
				.mapToLong(bi -> bi.longValue()).boxed()
				.collect(Collectors.toList());

		if (selectedRoadLocations.isEmpty()) {
			selectedRoadLocations = new ArrayList<>(
					roadLocationByLocationIdMap.size());

			selectedRoadLocations.addAll(roadLocationByLocationIdMap.keySet());
		}

		return selectedRoadLocations;
	}

	private AroEntity createAroNetworkNode(long id, int type) {
		return entityFactory.createCentralOfficeEquipment(id);
	}

	private enum FiberSourceMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance, node_type
	}

	private Collection<NetworkAssignment> queryFiberSources(long planId) {

		return toValidAssignments(planRepository
				.querySourceLocations(planId)
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.map(result -> {
					long tlid = result.getLong(FiberSourceMap.tlid);

					try {
						AroEntity aroEntity = createAroNetworkNode(
								result.getLong(FiberSourceMap.id),
								result.getInteger(FiberSourceMap.node_type));

						RoadLocation rl = RoadLocationImpl
								.build()
								.setTlid(tlid)
								.setLocationPoint(
										result.getPoint(FiberSourceMap.point))
								.setRoadSegmentPositionRatio(
										result.getDouble(FiberSourceMap.ratio))
								.setRoadSegmentClosestPoint(
										result.getPoint(FiberSourceMap.intersect_point))

								.setDistanceFromRoadSegmentInMeters(
										result.getDouble(FiberSourceMap.distance))
								.build();

						return new DefaultNetworkAssignment(aroEntity, rl);
					} catch (Throwable err) {
						LOG.error("Failed creating FiberSource for tlid "
								+ tlid + " due to: " + err.getMessage(), err);
						return null;
					}
				}));
	}

	private Collection<NetworkAssignment> getFiberSourceNetworkAssignments(
			NetworkDataRequest networkConfiguration) {

		return queryFiberSources(networkConfiguration.getPlanId());
	}

	private enum RoadEdgeMap implements OrdinalAccessor {
		gid, tlid, tnidf, tnidt, shape, edge_length
	}

	private Collection<RoadEdge> queryRoadEdges(long planId) {
		return planRepository
				.queryRoadEdgesbyPlanId(planId)
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.map(result -> {
					try {
						return new RoadEdgeImpl(result
								.getLong(RoadEdgeMap.tlid), result
								.getLong(RoadEdgeMap.tnidf), result
								.getLong(RoadEdgeMap.tnidt), result
								.getGeometry(RoadEdgeMap.shape), result
								.getDouble(RoadEdgeMap.edge_length));
					} catch (Exception err) {
						LOG.error(result.toString());
						LOG.error(err.getMessage(), err);
						return null;
					}
				}).filter(e -> e != null).collect(Collectors.toList());

	}

	private Collection<RoadEdge> getRoadEdges(
			NetworkDataRequest networkConfiguration) {
		return queryRoadEdges(networkConfiguration.getPlanId());
	}

	private static class EntityDemandMappingImpl implements EntityDemandMapping {

		public static Aggregator<EntityDemandMapping> aggregate() {
			return new EntityDemandMappingAggreagor();
		}

		public static class EntityDemandMappingAggreagor implements
				Aggregator<EntityDemandMapping> {

			private EntityDemandMappingImpl demandMapping = new EntityDemandMappingImpl(
					0, 0);

			@Override
			public void add(EntityDemandMapping val) {
				demandMapping.demand += val.getMappedDemand();
				demandMapping.revenue += val.getMappedRevenue();
			}

			@Override
			public EntityDemandMapping apply() {
				return demandMapping;
			}

		}

		private double demand;
		private double revenue;

		public EntityDemandMappingImpl(double demand, double revenue) {
			super();
			this.demand = demand;
			this.revenue = revenue;
		}

		@Override
		public double getMappedDemand() {
			return demand;
		}

		@Override
		public double getMappedRevenue() {
			return revenue;
		}

	}

	private static class LocationDemandMapping implements DemandMapping {

		public static Aggregator<LocationDemandMapping> aggregate() {
			return new DemandMappingAggregator();
		}

		private static class DemandMappingAggregator implements
				Aggregator<LocationDemandMapping> {

			private Map<LocationEntityType, Aggregator<EntityDemandMapping>> map = new EnumMap<>(
					LocationEntityType.class);

			public DemandMappingAggregator() {
				for (LocationEntityType type : LocationEntityType.values()) {
					map.put(type, EntityDemandMappingImpl.aggregate());
				}
			}

			@Override
			public void add(LocationDemandMapping val) {
				for (LocationEntityType type : LocationEntityType.values()) {
					map.get(type).add(val.getEntityDemandMapping(type));
				}
			}

			@Override
			public LocationDemandMapping apply() {
				Map<LocationEntityType, EntityDemandMapping> result = new EnumMap<>(
						LocationEntityType.class);

				for (LocationEntityType t : LocationEntityType.values()) {
					result.put(t, map.get(t).apply());
				}

				return new LocationDemandMapping(0, result);
			}

		}

		private int blockId;

		private Map<LocationEntityType, EntityDemandMapping> map = new EnumMap<>(
				LocationEntityType.class);
		private static final EntityDemandMapping zeroDemand = new EntityDemandMappingImpl(
				0, 0);

		public LocationDemandMapping(int blockId) {
			super();
			this.blockId = blockId;
		}

		public LocationDemandMapping(int blockId,
				Map<LocationEntityType, EntityDemandMapping> map) {
			this.blockId = blockId;
			this.map = map;
		}

		public boolean isEmpty() {
			return map.size() == 0;
		}

		public int getBlockId() {
			return blockId;
		}

		public void add(LocationEntityType type, EntityDemandMapping mapping) {
			map.put(type, mapping);
		}

//		public void addZeroDemand(LocationEntityType type) {
//			add(type, zeroDemand);
//		}

		public void add(LocationEntityType type, double demand, double revenue) {
			add(type, new EntityDemandMappingImpl(demand, revenue));
		}

		@Override
		public EntityDemandMapping getEntityDemandMapping(
				LocationEntityType type) {
			EntityDemandMapping edm = map.get(type);
			return edm == null ? zeroDemand : edm;
		}

	}

	private class LocationDemandAnalysisImpl implements LocationDemandAnalysis {

		private Map<Long, LocationDemandMapping> locationDemandMappingMap;
		private LocationDemand selectedDemand;

		private Map<SpeedCategory, LocationDemand> locationDemandMap = new EnumMap<>(
				SpeedCategory.class);

		public LocationDemandAnalysisImpl(
				Map<Long, LocationDemandMapping> locationDemandMappingMap,
				LocationDemand selectedDemand) {
			super();
			this.locationDemandMappingMap = locationDemandMappingMap;
			this.selectedDemand = selectedDemand;
		}

		@Override
		public LocationDemand getSelectedDemand() {
			return selectedDemand;
		}

		@Override
		public LocationDemand getLocationDemand(SpeedCategory speedCategory) {
			LocationDemand ld = locationDemandMap.get(speedCategory);
			if (ld == null) {
				locationDemandMap.put(speedCategory,
						ld = aggregateDemandForSpeedCategory(speedCategory));
			}
			return ld;
		}

		private LocationDemand aggregateDemandForSpeedCategory(
				SpeedCategory speedCategory) {

			Aggregator<LocationDemand> aggregator = DefaultLocationDemand
					.demandAggregate();

			locationDemandMappingMap
					.values()
					.stream()
					.map(ldm -> aroDemandService.createDemandByCensusBlock(
							ldm.getBlockId(), ldm, speedCategory))
					.forEach(ld -> {
						aggregator.add(ld);
					});

			return aggregator.apply();

		}

	}

}
