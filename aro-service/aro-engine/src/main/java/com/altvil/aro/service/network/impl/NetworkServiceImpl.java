package com.altvil.aro.service.network.impl;

import java.math.BigInteger;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.cache.CacheMetrics;
import org.apache.ignite.cluster.ClusterGroup;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.demand.impl.LocationDemandFactory;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.graph.model.NetworkStrategy;
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkRequest.LocationLoadingRequest;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.network.NetworkStrategyFactory;
import com.altvil.aro.service.network.NetworkStrategyRequest;
import com.altvil.aro.service.strategy.NoSuchStrategy;
import com.altvil.aro.service.strategy.StrategyService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;

@Service
public class NetworkServiceImpl implements NetworkService {

	private static final Logger log = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());

	@Autowired
	private NetworkPlanRepository planRepository;
	
	@Autowired
	private StrategyService strategyService;

	private EntityFactory entityFactory = EntityFactory.FACTORY;
	
	
	public static final String CACHE_LOCATION_DEMANDS_BY_WIRECENTER_ID = "NetworkService_LocationDemandsByWCID";
	public static final String CACHE_ROAD_LOCATIONS_BY_WIRECENTER_ID = "NetworkService_RoadLocationsByWCID";
	public static final String CACHE_FIBER_SOURCES_BY_WIRECENTER_ID = "NetworkService_FiberSourcesByWCID";
	public static final String CACHE_ROAD_EDGES_BY_WIRECENTER_ID = "NetworkService_RoadEdgesByWCID";

	private Ignite ignite;
	private static IgniteCache<Long, Map<Long, LocationDemand>> locDemandCache;
	private static IgniteCache<Long, Map<Long, RoadLocation>> roadLocCache;
	private static IgniteCache<Long, Collection<NetworkAssignment>> fiberSourceLocCache;
	private static IgniteCache<Long, Collection<RoadEdge>> roadEdgesCache;

	@PostConstruct
	private void postConstruct()
	{
		//TODO MEDIUM investigate whether the multiple caches partition by wirecenter ID and naturally co-locate due to this
		locDemandCache = ignite.getOrCreateCache(CACHE_LOCATION_DEMANDS_BY_WIRECENTER_ID);
		roadLocCache = ignite.getOrCreateCache(CACHE_ROAD_LOCATIONS_BY_WIRECENTER_ID);
		fiberSourceLocCache = ignite.getOrCreateCache(CACHE_FIBER_SOURCES_BY_WIRECENTER_ID);
		roadEdgesCache = ignite.getOrCreateCache(CACHE_ROAD_EDGES_BY_WIRECENTER_ID);
	}
	
	//Note: cannot autowire as Map<String,Ignite> and lookup by key, because the map keys ignore bean aliases!
	@Autowired
	private void setNetworkServiceIgniteGrid(Ignite igniteBean)
	{
		this.ignite = igniteBean;
	}
	
	@Override
	public NetworkData getNetworkData(NetworkRequest networkRequest) {

		NetworkData networkData = new NetworkData();

		//determine wirecenter ID
		Long wcid = getWirecenterIdByPlanId(networkRequest.getPlanId());
		List<Long> safeList = selectedRoadLocationIds(networkRequest);
		networkData.setSelectedRoadLocationIds(safeList);
		
		//TODO MEDIUM Compare performance
		networkData.setFiberSources(getFiberSourceNetworkAssignments(networkRequest, wcid));
		networkData.setRoadLocations(getRoadLocationNetworkAssignments(networkRequest, wcid, safeList));
		networkData.setRoadEdges(getRoadEdges(networkRequest, wcid));

		return networkData;
	}

	private Collection<NetworkAssignment> toValidAssignments(
			Stream<NetworkAssignment> stream) {
		return stream.filter((na) -> na != null).collect(Collectors.toList());
	}

	private enum LocationMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance
	}

	private enum LoctationDemandMap implements OrdinalAccessor {
		location_id, buesiness_fiber, tower_fiber, household_fiber
	}
	
	private Map<Long, LocationDemand> getLocationDemand(NetworkRequest networkRequest, Long wirecenterId) {
		Map<Long, LocationDemand> locDemands;
		
		//retrieve all locations from cache by wirecenter ID
		//if cache miss, populate the cache by wirecenterID with results of ALL request

		locDemands = null;//locDemandCache.get(wirecenterId);
		if (null == locDemands) 
		{
			locDemands = queryLocationDemand(networkRequest);
			locDemandCache.put(wirecenterId, locDemands);
			//NOTE: currently no update policy used as LocationDemand is temporarily assumed immutable
		}
		
		if (log.isDebugEnabled()) logCacheStats(locDemandCache);
				
		//if SELECTED request, filter them
		if (LocationLoadingRequest.SELECTED == networkRequest.getLocationLoadingRequest())
		{
			//TODO filter locations (were not being filtered in non-cached implementation!)
			log.warn("LocationDemand not yet being filtered for SELECTED requests");
		}
		return locDemands;
	}
	
	private void logCacheStats(IgniteCache<?, ?> cache)
	{
		//TODO MEDIUM sleep 2s+ first for accurate metrics, as metrics are collected at intervals so they'll never be accurate if logged instantly.  Consider forking logging thread (has downsides). 
		ClusterGroup cgrp = ignite.cluster().forDataNodes(cache.getName());
		CacheMetrics cm = cache.metrics(cgrp);
		log.debug("DataNodes: " + cm.name() + " CollectStats:" + cm.isStatisticsEnabled() + " Hit:" + cm.getCacheHits() + " Miss:" + cm.getCacheMisses() + " Size:" + cm.getSize());

			// optional local node reporting
//			ClusterGroup lgrp = ignite.cluster().forLocal();
//			CacheMetrics lcm = cache.metrics(lgrp);
//			log.debug("**    Local: " + lcm.name() + " CollectStats:" + lcm.isStatisticsEnabled() + " Hit:" + lcm.getCacheHits() + " Miss:" + lcm.getCacheMisses() + " Size:" + lcm.getSize());

			// optional cache memory mode peek
//			log.debug("** Peek All:" + cache.size(CachePeekMode.ALL) + " Near:" + cache.size(CachePeekMode.NEAR) + " Local:" + cache.localSize(CachePeekMode.ALL) + " Primary:" + cache.size(CachePeekMode.PRIMARY) + " OnHeap:" + cache.size(CachePeekMode.ONHEAP) + " OffHeap:" + cache.size(CachePeekMode.OFFHEAP) + " Swap:" + cache.size(CachePeekMode.SWAP));

//			String logString = "**Cache: " + cache.getName() + " Hit:" + cm.getCacheHits() + " Miss:" + cm.getCacheMisses() + " Size:" + cm.getSize();
//			log.debug(logString);
//			System.out.println(logString);
	}

	private Map<Long, LocationDemand> queryLocationDemand(
			NetworkRequest networkRequest) {

		Map<Long, LocationDemand> map = new HashMap<>();
		planRepository.queryAllFiberDemand(networkRequest.getPlanId(), networkRequest.getYear())
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.forEach(
						result -> {
							map.put(result
									.getLong(LoctationDemandMap.location_id),
									LocationDemandFactory.FACTORY.create(
											result.getDouble(LoctationDemandMap.household_fiber),
											result.getDouble(LoctationDemandMap.buesiness_fiber),
											result.getDouble(LoctationDemandMap.tower_fiber)));
										
						});

		return map;

	}
	
	private Long getWirecenterIdByPlanId(long planId) 
	{
		return planRepository.queryWirecenterIdForPlanId(planId);
	}

	private Map<Long, RoadLocation> queryRoadLocations(NetworkRequest networkRequest)
	{
		Map<Long, RoadLocation> roadLocationsMap = new HashMap<>();
		planRepository
		.queryAllLocationsByPlanId(networkRequest.getPlanId())
		.stream()
		.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
		.forEach(result -> {
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
					.build(); //TODO why build() twice? does second produce a deep clone?

				roadLocationsMap.put(locationId, rl);
			} catch (Throwable err) {
				log.error("Failed creating RoadLocation for locationId " + locationId + " due to: " + err.getMessage(), err);
			}
		});
		return roadLocationsMap;
	}
	
	private Map<Long, RoadLocation> getRoadLocationNetworkLocations(NetworkRequest networkRequest, Long wirecenterId) {
		Map<Long, RoadLocation> roadLocations;
		
		//retrieve all locations from cache by wirecenter ID
		//if cache miss, populate the cache by wirecenterID with results of ALL request

		roadLocations = null;//roadLocCache.get(wirecenterId);
		if (null == roadLocations) 
		{
			roadLocations = queryRoadLocations(networkRequest);
			roadLocCache.put(wirecenterId, roadLocations);
			//NOTE: currently no update policy used as RoadLocation is temporarily assumed immutable
		}
	
		if (log.isDebugEnabled()) logCacheStats(roadLocCache);

		return roadLocations;
	}

	private List<Long> selectedRoadLocationIds(NetworkRequest networkRequest) {
		Long lookupKey = networkRequest.getPlanId();
		List<BigInteger> selectedLocIds = planRepository.querySelectedLocationsByPlanId(lookupKey);
		List<Long> safeList = selectedLocIds.stream().mapToLong(bi -> bi.longValue()).boxed().collect(Collectors.toList());
		return safeList;
	}

	// TODO Convert safeList into a predicate
	private Collection<NetworkAssignment> getRoadLocationNetworkAssignments(NetworkRequest networkRequest, Long wirecenterId, List<Long> safeList) 
	{
		Map<Long, LocationDemand> demandByLocationIdMap = getLocationDemand(networkRequest, wirecenterId);
		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(networkRequest, wirecenterId);
	
		if (LocationLoadingRequest.SELECTED == networkRequest.getLocationLoadingRequest())
		{
			roadLocationByLocationIdMap.keySet().retainAll(safeList);
		}

		
		return toValidAssignments(roadLocationByLocationIdMap.keySet().stream()
			.map(result -> {
				Long locationId = result;
				
				LocationDemand ldm = demandByLocationIdMap.get(locationId);
				if (ldm == null || ldm.getDemand() == 0) {
					// No Demand no location mapped in for fiber Linking
					return null;
				}

				AroEntity aroEntity = entityFactory
						.createLocationEntity(locationId, ldm);
				
				return new DefaultNetworkAssignment(aroEntity, roadLocationByLocationIdMap.get(locationId));
			}));
	}

	private AroEntity createAroNetworkNode(long id, int type) {
		return entityFactory.createCentralOfficeEquipment(id);
	}

	private enum FiberSourceMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance, node_type
	}

	private Collection<NetworkAssignment> queryFiberSources(
			NetworkRequest networkRequest) {

		return toValidAssignments(planRepository
				.querySourceLocations(networkRequest.getPlanId())
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
						log.error("Failed creating FiberSource for tlid " + tlid + " due to: " + err.getMessage(), err);
						return null;
					}
				}));
	}

	private Collection<NetworkAssignment> getFiberSourceNetworkAssignments(NetworkRequest networkRequest, Long wirecenterId) {
		Collection<NetworkAssignment> fiberSourceLocations;
		
		//retrieve all locations from cache by wirecenter ID
		//if cache miss, populate the cache by wirecenterID with results of ALL request

		fiberSourceLocations = null;//fiberSourceLocCache.get(wirecenterId);
		if (null == fiberSourceLocations) 
		{
			fiberSourceLocations = queryFiberSources(networkRequest);
			fiberSourceLocCache.put(wirecenterId, fiberSourceLocations);
		}
		//NOTE: currently never updating FiberSource as it is temporarily assumed immutable
		
		if (log.isDebugEnabled()) logCacheStats(fiberSourceLocCache);
				
		//return results
		return fiberSourceLocations;
	}

	private enum RoadEdgeMap implements OrdinalAccessor {
		gid, tlid, tnidf, tnidt, shape, edge_length
	}

	private Collection<RoadEdge> queryRoadEdges(NetworkRequest networkRequest) {
		return planRepository
				.queryRoadEdgesbyPlanId(networkRequest.getPlanId())
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
	
	private Collection<RoadEdge> getRoadEdges(NetworkRequest networkRequest, Long wirecenterId) {
		Collection<RoadEdge> roadEdges;
		
		//retrieve all locations from cache by wirecenter ID
		//if cache miss, populate the cache by wirecenterID with results of ALL request

		roadEdges = roadEdgesCache.get(wirecenterId);
		if (null == roadEdges) 
		{
			roadEdges = queryRoadEdges(networkRequest);
			roadEdgesCache.put(wirecenterId, roadEdges);
			//NOTE: currently no update policy used as RoadEdge is temporarily assumed immutable
		}
		
		if (log.isDebugEnabled()) logCacheStats(roadEdgesCache);
				
		//return results
		return roadEdges;
	}

	@Override
	public NetworkStrategy getNetworkStrategy(NetworkStrategyRequest request) throws NoSuchStrategy {
		return strategyService.getStrategy(NetworkStrategyFactory.class, request.getAlgorithm()).getNetworkStrategy(request);
	}
}
