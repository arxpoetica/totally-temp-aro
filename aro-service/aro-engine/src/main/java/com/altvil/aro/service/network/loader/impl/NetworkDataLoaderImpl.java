package com.altvil.aro.service.network.loader.impl;

import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.cu.ComputeUnit;
import com.altvil.aro.service.cu.ComputeUnitBuilder.ExecutionCachePolicy;
import com.altvil.aro.service.cu.ComputeUnitService;
import com.altvil.aro.service.cu.cache.impl.DefaultCacheStrategy;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.Priority;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.network.impl.CableConduitEdgeImpl;
import com.altvil.aro.service.network.impl.DefaultNetworkAssignment;
import com.altvil.aro.service.network.impl.RoadEdgeImpl;
import com.altvil.aro.service.network.impl.RoadLocationImpl;
import com.altvil.aro.service.network.loader.NetworkDataLoader;
import com.altvil.aro.service.network.model.LocationData;
import com.altvil.aro.service.network.model.NetworkEquipmentData;
import com.altvil.aro.service.network.model.ServiceData;
import com.altvil.aro.service.plan.impl.PlanServiceImpl;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;


@Service
public class NetworkDataLoaderImpl implements NetworkDataLoader {

	private static final Logger log = LoggerFactory
			.getLogger(PlanServiceImpl.class.getName());

	private EntityFactory entityFactory = EntityFactory.FACTORY;
	
	@Autowired
	private NetworkPlanRepository planRepository;
	@Autowired
	private ComputeUnitService computeUnitService;

	private Map<Integer, CableConstructionEnum> cableConstructionEnumMap;

	private ComputeUnit<ServiceData> serviceDataCu;
	private ComputeUnit<LocationData> locationDataCu;
	private ComputeUnit<NetworkEquipmentData> networkDataCu;
	
	
	@Override
	public ServiceData loadServiceData(int wireCenter) {
		return serviceDataCu.gridLoad(Priority.HIGH,
				CacheQuery.build(wireCenter).build());
	}

	@Override
	public LocationData loadLocationData(int wireCenter, int year) {
		return locationDataCu.gridLoad(Priority.HIGH,
				CacheQuery.build(wireCenter).add("year", year).build());
	}

	@Override
	public NetworkEquipmentData loadNetworkEquipmentData(int planId) {
		return networkDataCu.gridLoad(Priority.HIGH, CacheQuery.build(planId)
				.build());
	}

	void postConstruct() {
		
		cableConstructionEnumMap = StreamUtil
				.hashEnum(CableConstructionEnum.class);
		
		locationDataCu = computeUnitService
				.build(LocationData.class, NetworkDataService.class)
				.setName("location-data")
				.setCacheMemorySize(10)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setCacheStrategy(new DefaultCacheStrategy() {
					@Override
					public CacheQuery toCacheQuery(AroKey key) {
						return super.toCacheQuery(key);
					}

					@Override
					public Collection<CacheQuery> getPreCacheQueries() {
						return super.getPreCacheQueries();
					}
				})
				.setVersionTypes(EnumSet.of(VersionType.LOCATION))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _loadLocationData(cacheQuery
								.getAroKey().getServiceAreaId(), cacheQuery.getParam("year", Integer.class))).build();

		serviceDataCu = computeUnitService
				.build(ServiceData.class, NetworkDataService.class)
				.setName("service-data")
				.setCacheMemorySize(10)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setCacheStrategy(new DefaultCacheStrategy() {
					@Override
					public CacheQuery toCacheQuery(AroKey key) {
						return super.toCacheQuery(key);
					}

					@Override
					public Collection<CacheQuery> getPreCacheQueries() {
						return super.getPreCacheQueries();
					}
				})
				.setVersionTypes(EnumSet.of(VersionType.SERVICE))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _loadServiceData(cacheQuery
								.getAroKey().getServiceAreaId())).build();

		networkDataCu = computeUnitService
				.build(NetworkEquipmentData.class, NetworkDataService.class)
				.setName("network-data")
				.setCacheMemorySize(10)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setCacheStrategy(new DefaultCacheStrategy() {
					@Override
					public CacheQuery toCacheQuery(AroKey key) {
						return super.toCacheQuery(key);
					}

					@Override
					public Collection<CacheQuery> getPreCacheQueries() {
						return super.getPreCacheQueries();
					}
				})
				.setVersionTypes(EnumSet.of(VersionType.LOCATION))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _loadNetworkEquipmentData(cacheQuery
								.getAroKey().getDeploymentPlanId())).build();

	}

	//
	// ServiceData
	//
	
	private ServiceData _loadServiceData(int wirecenterId) {
		return new ServiceData(getRoadEdges(wirecenterId), queryCableConduitEdges(wirecenterId)) ;
	}
	
	private enum ConduitEdgeMap implements OrdinalAccessor {
		gid, constructionType, startRatio, endRatio
	}
	
	private Collection<CableConduitEdge> queryCableConduitEdges(
			int wirecenterId) {
		return planRepository
				.queryConduitSectionsByWirecenterId(wirecenterId)
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.map(result -> {
					return new CableConduitEdgeImpl(
							result.getLong(ConduitEdgeMap.gid),
							cableConstructionEnumMap.get(result
									.getInteger(ConduitEdgeMap.constructionType)),
							result.getDouble(ConduitEdgeMap.startRatio), result
									.getDouble(ConduitEdgeMap.endRatio));
				}).collect(Collectors.toList());

	}
	
	private enum RoadEdgeMap implements OrdinalAccessor {
		gid, tlid, tnidf, tnidt, shape, edge_length
	}
	private Collection<RoadEdge> getRoadEdges(
			int wirecenterId) {
		return planRepository
				.queryRoadEdgesByWirecenterId(wirecenterId)
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
						log.error(result.toString());
						log.error(err.getMessage(), err);
						return null;
					}
				}).filter(e -> e != null).collect(Collectors.toList());
	}
	
	
	//
	//
	//
	

	private NetworkEquipmentData _loadNetworkEquipmentData(long planId) {
		return new NetworkEquipmentData(queryFiberSources(planId));
	}
	
	private AroEntity createAroNetworkNode(long id, int type) {
		return entityFactory.createCentralOfficeEquipment(id);
	}
	
	private Collection<NetworkAssignment> toValidAssignments(
			Stream<NetworkAssignment> stream) {
		return stream.filter((na) -> na != null).collect(Collectors.toList());
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
						log.error("Failed creating FiberSource for tlid "
								+ tlid + " due to: " + err.getMessage(), err);
						return null;
					}
				}));
	}

	//
	// Mapping
	//

	private LocationEntityType toLocationEntityType(int entityTypeCode) {
		return LocationEntityTypeMapping.MAPPING
				.toLocationEntityType(entityTypeCode);
	}

	//
	// RoadLocations
	//

	private LocationData _loadLocationData(int wirecenterId, int year) {
		return new LocationData(queryLocationDemand(wirecenterId, year), queryRoadLocations(wirecenterId)) ;
	}

	private enum LocationMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance
	}

	private Map<Long, RoadLocation> queryRoadLocations(int wirecenterId) {
		Map<Long, RoadLocation> roadLocationsMap = new HashMap<>();
		planRepository
				.queryAllLocationsByWirecenterId(wirecenterId)
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
										.build();
								roadLocationsMap.put(locationId, rl);
							} catch (Throwable err) {
								log.error(
										"Failed creating RoadLocation for locationId "
												+ locationId + " due to: "
												+ err.getMessage(), err);
							}
						});
		return roadLocationsMap;
	}

	private enum EntityDemandMap implements OrdinalAccessor {
		location_id, block_id, entity_type, count, monthly_spend, competitive_strength
	}

	private Map<Long, CompetitiveLocationDemandMapping> queryLocationDemand(
			int wirecenterId, int year) {
		return assembleMapping(planRepository.queryAllFiberDemandByWirecenterId(wirecenterId, year));
	}

	private Map<Long, CompetitiveLocationDemandMapping> assembleMapping(
			List<Object[]> entityDemands) {
		Map<Long, CompetitiveLocationDemandMapping> map = new HashMap<>();

		entityDemands
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.forEach(
						d -> {

							Long locationId = d
									.getLong(EntityDemandMap.location_id);

							CompetitiveLocationDemandMapping ldm = map
									.get(locationId);
							if (ldm == null) {
								map.put(locationId,
										ldm = new CompetitiveLocationDemandMapping(
												d.getInteger(EntityDemandMap.block_id),
												d.getDouble(EntityDemandMap.competitive_strength)));
							}

							LocationEntityType lt = toLocationEntityType(d
									.getInteger(EntityDemandMap.entity_type));

							ldm.add(lt, d.getDouble(EntityDemandMap.count),
									d.getDouble(EntityDemandMap.monthly_spend));

						});

		return map;
	}

}
