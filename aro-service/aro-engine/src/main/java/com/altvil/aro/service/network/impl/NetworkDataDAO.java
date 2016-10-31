package com.altvil.aro.service.network.impl;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import com.altvil.aro.service.network.DataSourceScope;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.ComputeUnit;
import com.altvil.aro.service.cu.ComputeUnitBuilder.ExecutionCachePolicy;
import com.altvil.aro.service.cu.ComputeUnitService;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.Priority;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.network.ServiceAreaContext;
import com.altvil.aro.service.network.model.PlanConduitEdges;
import com.altvil.aro.service.network.model.ServiceAreaLocationDemand;
import com.altvil.aro.service.network.model.ServiceAreaRoadEdges;
import com.altvil.aro.service.network.model.ServiceAreaRoadLocations;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;

@Service
public class NetworkDataDAO implements ComputeServiceApi, NetworkQueryService {
	private static final Logger LOG = LoggerFactory
			.getLogger(NetworkDataDAO.class.getName());
	@Autowired
	private NetworkPlanRepository planRepository;

	private Map<Integer, CableConstructionEnum> cableConstructionEnumMap;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	@Autowired
	private ComputeUnitService computeUnitService;

	private ComputeUnit<ServiceAreaRoadEdges> serviceAreaRoadEdges;
	private ComputeUnit<ServiceAreaRoadLocations> serviceAreaRoadLocations;
	private ComputeUnit<ServiceAreaLocationDemand> locationDemand;
	private ComputeUnit<PlanConduitEdges> existingCableConduitEdges;

	@PostConstruct
	void postConstruct() {
		cableConstructionEnumMap = StreamUtil
				.hashEnum(CableConstructionEnum.class);
		initStructs();
	}

	@SuppressWarnings("unchecked")
	private void initStructs() {

		serviceAreaRoadEdges = computeUnitService
				.build(ServiceAreaRoadEdges.class, this.getClass())
				.setName("service_area_road_edges")
				.setCacheMemorySize(100)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setVersionTypes(EnumSet.of(VersionType.SERVICE))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _getRoadEdges(cacheQuery
								.getServiceAreaId(), cacheQuery.getParam(
								"serviceAreaContext", ServiceAreaContext.class)))
				.build();

		serviceAreaRoadLocations = computeUnitService
				.build(ServiceAreaRoadLocations.class, this.getClass())
				.setName("service_area_road_locations")
				.setCacheMemorySize(100)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setVersionTypes(EnumSet.of(VersionType.SERVICE))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _queryRoadLocations(cacheQuery
								.getServiceAreaId(), cacheQuery.getParam(
								"serviceAreaContext", ServiceAreaContext.class))

				).build();

		locationDemand = computeUnitService
				.build(ServiceAreaLocationDemand.class, this.getClass())
				.setName("location_demand")
				.setCacheMemorySize(100)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setVersionTypes(EnumSet.of(VersionType.SERVICE))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _queryFiberDemand(cacheQuery
								.getServiceAreaId(), cacheQuery.getParam(
								"year", Integer.class), cacheQuery.getParam(
								"mrc", Double.class), 
								cacheQuery.getParam("selectedTypes", OrderedSet.class),
								cacheQuery.getParam("serviceAreaContext", ServiceAreaContext.class),
								cacheQuery.getParam("dataSourceScope", DataSourceScope.class))).build();
		existingCableConduitEdges = computeUnitService
				.build(PlanConduitEdges.class, this.getClass())
				.setName("existing_cable_conduitEdges")
				.setCacheMemorySize(100)
				.setExecutionCachePolicies(
						EnumSet.of(ExecutionCachePolicy.MEMORY,
								ExecutionCachePolicy.PERSISTENCE))
				.setVersionTypes(EnumSet.of(VersionType.SERVICE))
				.setCacheLoaderFunc(
						(cacheQuery) -> () -> _queryExistingCableConduitEdges(cacheQuery
								.getServiceAreaId())).build();

	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#queryLocationDemand
	 * (boolean, java.util.Set, int, long, int, double,
	 * com.altvil.aro.service.network.ServiceAreaContext)
	 */
	@Override
	public Map<Long, CompetitiveLocationDemandMapping> queryLocationDemand(
			Set<LocationEntityType> selectedTypes, int serviceAreaId,
			long planId, int year, double mrc, ServiceAreaContext ctx, DataSourceScope dataSourceScope) {

		return queryFiberDemand(
				serviceAreaId, year, mrc, selectedTypes, ctx, dataSourceScope)
				.getDemandMapping();
	}

	private ServiceAreaLocationDemand queryFiberDemand(int serviceAreaId,
			int year, double mrc, Set<LocationEntityType> selectedTypes,
			ServiceAreaContext ctx, DataSourceScope dataSourceScope) {
		return locationDemand.gridLoad(
				Priority.HIGH,
				CacheQuery.build(serviceAreaId).add("year", year)
						.add("mrc", mrc)
						.add("selectedTypes", new OrderedSet<LocationEntityType>(selectedTypes))
						.add("serviceAreaContext", ctx)
						.add("dataSourceScope", dataSourceScope)
						.build());

	}

	private ServiceAreaLocationDemand _queryFiberDemand(int serviceAreaId,
														int year, double mrc, Set<LocationEntityType> selectedTypes,
														ServiceAreaContext ctx, DataSourceScope dataSourceScope) {
		return ServiceAreaLocationDemand
				.build()
				.setMapping(
						assembleMapping(planRepository.queryAllFiberDemand(
								serviceAreaId, year, mrc, ctx.getStateCodes(), dataSourceScope.getDataSourceIds(LocationEntityType.celltower))))
				.filterBySelectedTypes(selectedTypes).build();
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

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#queryRoadLocations
	 * (int, com.altvil.aro.service.network.ServiceAreaContext)
	 */
	@Override
	public ServiceAreaRoadLocations queryRoadLocations(int serviceAreaId,
			ServiceAreaContext ctx) {
		return serviceAreaRoadLocations.gridLoad(Priority.HIGH, CacheQuery
				.build(serviceAreaId).add("serviceAreaContext", ctx).build());
	}

	private ServiceAreaRoadLocations _queryRoadLocations(int serviceAreaId,
			ServiceAreaContext ctx) {
		Map<Long, RoadLocation> roadLocationsMap = new HashMap<>();
		planRepository
				.queryAllLocationsByServiceAreaId(serviceAreaId,
						ctx.getStateCodes(), ctx.getFipsCodes())
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
								LOG.error(
										"Failed creating RoadLocation for locationId "
												+ locationId + " due to: "
												+ err.getMessage(), err);
							}
						});
		return new ServiceAreaRoadLocations(roadLocationsMap);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#queryFiberSources
	 * (long, com.altvil.aro.service.network.ServiceAreaContext)
	 */
	@Override
	public Collection<NetworkAssignment> queryFiberSources(long planId,
			ServiceAreaContext ctx) {

		return planRepository
				.querySourceLocations(planId, ctx.getFipsCodes())
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
				}).filter(Objects::nonNull).collect(Collectors.toList());
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#getRoadEdges(int,
	 * com.altvil.aro.service.network.ServiceAreaContext)
	 */
	@Override
	public ServiceAreaRoadEdges getRoadEdges(int serviceAreaId,
			ServiceAreaContext ctx) {
		return serviceAreaRoadEdges.gridLoad(
				Priority.HIGH,
				CacheQuery.build(serviceAreaId)
						.add("serviceAreaContext", (Serializable) ctx).build());
	}

	private ServiceAreaRoadEdges _getRoadEdges(int serviceAreaId,
			ServiceAreaContext ctx) {
		return new ServiceAreaRoadEdges(planRepository
				.queryRoadEdgesbyServiceAreaId(serviceAreaId,
						ctx.getFipsCodes())
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
				}).filter(e -> e != null).collect(Collectors.toList()));
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.network.impl.NetworkQueryService#
	 * getSelectedRoadLocationIds(long, java.util.Map)
	 */
	@Override
	public Set<Long> getSelectedRoadLocationIds(long planId) {
		return planRepository.querySelectedLocationsByPlanId(planId)
				.stream()
				.map(Number::longValue)
				.collect(Collectors.toSet());
	}

	private LocationEntityType toLocationEntityType(int entityTypeCode) {
		return LocationEntityTypeMapping.MAPPING
				.toLocationEntityType(entityTypeCode);
	}

	private AroEntity createAroNetworkNode(long id, int type) {
		return entityFactory.createCentralOfficeEquipment(id);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#queryPlanConditEdges
	 * (long)
	 */
	@Override
	public Collection<CableConduitEdge> queryPlanConditEdges(long planid) {
		return planRepository
				.queryPlanConduitSections(planid)
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

	/*
	 * (non-Javadoc)
	 * 
	 * @see com.altvil.aro.service.network.impl.NetworkQueryService#
	 * queryExistingCableConduitEdges(long)
	 */
	@Override
	public Collection<CableConduitEdge> queryExistingCableConduitEdges(
			int serviceAreaId) {
		return existingCableConduitEdges.gridLoad(Priority.HIGH,
				CacheQuery.build(serviceAreaId).build()).getEdges();

	}

	private PlanConduitEdges _queryExistingCableConduitEdges(int wirecenterId) {
		return new PlanConduitEdges(
				planRepository
						.queryConduitSections(wirecenterId)
						.stream()
						.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
						.map(result -> {
							return new CableConduitEdgeImpl(
									result.getLong(ConduitEdgeMap.gid),
									cableConstructionEnumMap.get(result
											.getInteger(ConduitEdgeMap.constructionType)),
									result.getDouble(ConduitEdgeMap.startRatio),
									result.getDouble(ConduitEdgeMap.endRatio));
						})
						.filter(ce -> (ce.getEndRatio() - ce.getStartRatio()) > 0.000001)
						.collect(Collectors.toList()));

	}

	private enum StateCodeMap implements OrdinalAccessor {
		state, fips_code
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#getServiceAreaCodes
	 * (java.lang.Integer)
	 */
	@Override
	public Collection<StateCode> getServiceAreaCodes(Integer serviceAreaId) {
		return planRepository
				.getServiceAreaStates(serviceAreaId)
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.map(r -> new StateCode(r.getString(StateCodeMap.state), r
						.getString(StateCodeMap.fips_code)))
				.collect(Collectors.toList());
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.altvil.aro.service.network.impl.NetworkQueryService#getServiceAreaContext
	 * (java.lang.Integer)
	 */
	@Override
	public ServiceAreaContext getServiceAreaContext(Integer serviceAreaId) {
		Collection<StateCode> stateCodes = getServiceAreaCodes(serviceAreaId);

		List<String> states = new ArrayList<>(stateCodes.size());
		List<String> fipsCodes = new ArrayList<>(stateCodes.size());

		stateCodes.forEach(c -> {
			states.add(c.getState());
			fipsCodes.add(c.getFipsCode());
		});

		return new ServiceAreaContext(states, fipsCodes);

	}

	private enum EntityDemandMap implements OrdinalAccessor {
		location_id, block_id, entity_type, count, monthly_spend, competitive_strength
	}

	private enum RoadEdgeMap implements OrdinalAccessor {
		gid, tlid, tnidf, tnidt, shape, edge_length
	}

	private enum ConduitEdgeMap implements OrdinalAccessor {
		gid, constructionType, startRatio, endRatio
	}

	private enum LocationMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance
	}

	private enum FiberSourceMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance, node_type
	}

}
