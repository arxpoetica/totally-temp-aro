package com.altvil.aro.service.network.impl;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.apache.ignite.Ignite;
import org.apache.ignite.IgniteCache;
import org.apache.ignite.Ignition;
import org.apache.ignite.cache.CacheMetrics;
import org.apache.ignite.configuration.CacheConfiguration;
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
import com.altvil.aro.service.network.NetworkRequest;
import com.altvil.aro.service.network.NetworkRequest.LocationLoadingRequest;
import com.altvil.aro.service.network.NetworkService;
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

	private EntityFactory entityFactory = EntityFactory.FACTORY;
	
	
	private Ignite ignite;
	//TODO configure grid caches via Spring rather than method calls
	public static final String CACHE_LOCATION_DEMANDS_BY_WIRECENTER_ID = NetworkServiceImpl.class.getSimpleName() + "_LocationDemandsByWCID";
	public static final String CACHE_ROAD_LOCATIONS_BY_WIRECENTER_ID = NetworkServiceImpl.class.getSimpleName() + "_RoadLocationsByWCID";
	public static final String CACHE_FIBER_SOURCES_BY_WIRECENTER_ID = NetworkServiceImpl.class.getSimpleName() + "_FiberSourcesByWCID";
	private static CacheConfiguration<Long, Map<Long, LocationDemand>> cacheConfigLocationDemandByWCID = cacheConfigLocationDemandByWCID();
	private static CacheConfiguration<Long, Map<Long, RoadLocation>> cacheConfigRoadLocationsByWCID = cacheConfigRoadLocationsByWCID();
	private static CacheConfiguration<Long, Collection<NetworkAssignment>> cacheConfigFiberSourcesByWCID = cacheConfigFiberSourcesByWCID();

	@PostConstruct
	private void postConstruct()
	{
		//TODO configure via main Spring file
		ignite = Ignition.start("/aroServlet-IgniteConfig.xml");
	}
	
	@Override
	public NetworkData getNetworkData(NetworkRequest networkRequest) {

		NetworkData networkData = new NetworkData();

		//determine wirecenter ID
		Long wcid = getWirecenterIdByPlanId(networkRequest.getPlanId());
		
		networkData.setFiberSources(getFiberSourceNetworkAssignments(networkRequest, wcid));
		networkData.setRoadLocations(getRoadLocationNetworkAssignments(networkRequest, wcid));
		networkData.setRoadEdges(getRoadEdges(networkRequest));

		return networkData;
	}

	private static CacheConfiguration<Long, Map<Long, LocationDemand>> cacheConfigLocationDemandByWCID() {
		CacheConfiguration<Long, Map<Long, LocationDemand>> cfg = new CacheConfiguration<>(CACHE_LOCATION_DEMANDS_BY_WIRECENTER_ID);
		//TODO configure cache
		log.warn("Ingite cache using default config for CACHE_LOCATION_DEMAND_BY_WIRECENTER_ID (" + CACHE_LOCATION_DEMANDS_BY_WIRECENTER_ID + ")");
		return cfg;
	}

	private static CacheConfiguration<Long, Map<Long, RoadLocation>> cacheConfigRoadLocationsByWCID() {
		CacheConfiguration<Long, Map<Long, RoadLocation>> cfg = new CacheConfiguration<>(CACHE_ROAD_LOCATIONS_BY_WIRECENTER_ID);
		//TODO configure cache
		log.warn("Ingite cache using default config for CACHE_ROAD_LOCATION_BY_WIRECENTER_ID (" + CACHE_ROAD_LOCATIONS_BY_WIRECENTER_ID + ")");
		return cfg;
	}

	private static CacheConfiguration<Long, Collection<NetworkAssignment>> cacheConfigFiberSourcesByWCID() {
		CacheConfiguration<Long, Collection<NetworkAssignment>> cfg = new CacheConfiguration<>(CACHE_FIBER_SOURCES_BY_WIRECENTER_ID);
		//TODO configure cache
		log.warn("Ingite cache using default config for CACHE_FIBER_SOURCES_BY_WIRECENTER_ID (" + CACHE_FIBER_SOURCES_BY_WIRECENTER_ID + ")");
		return cfg;
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

		IgniteCache<Long, Map<Long, LocationDemand>> locDemandCache = ignite.getOrCreateCache(cacheConfigLocationDemandByWCID);
		if (null != locDemandCache && locDemandCache.containsKey(wirecenterId)) 
		{
			locDemands = locDemandCache.get(wirecenterId);
		}
		else
		{
			locDemands = queryLocationDemand(networkRequest);
			locDemandCache.put(wirecenterId, locDemands);
			//TODO implement an eviction policy
		}
		
		if (log.isDebugEnabled()) logCacheStats(locDemandCache);
				
		//if SELECTED request, filter them
		if (LocationLoadingRequest.SELECTED == networkRequest.getLocationLoadingRequest())
		{
			//TODO filter locations
			log.warn("LocationDemand not yet being filtered for SELECTED requests");
		}
		//return results
		return locDemands;
	}
	
	private void logCacheStats(IgniteCache<?, ?> cache)
	{
		CacheMetrics cm = cache.metrics();
		log.debug("**Cache: " + cache.getName() + " Hit:" + cm.getCacheHits() + " Miss:" + cm.getCacheMisses() + " Size:" + cm.getSize());
//		String logString = "**Cache: " + cache.getName() + " Hit:" + cm.getCacheHits() + " Miss:" + cm.getCacheMisses() + " Size:" + cm.getSize();
//		log.debug(logString);
//		System.out.println(logString);
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
											//result.getDouble(LoctationDemandMap.tower_fiber)));
											0));
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

		IgniteCache<Long, Map<Long, RoadLocation>> roadLocCache = ignite.getOrCreateCache(cacheConfigRoadLocationsByWCID);
		//TODO adjust the cache population strategy to one which supports hit/miss metrics
		if (null != roadLocCache && roadLocCache.containsKey(wirecenterId)) 
		{
			roadLocations = roadLocCache.get(wirecenterId);
		}
		else
		{
			roadLocations = queryRoadLocations(networkRequest);
			roadLocCache.put(wirecenterId, roadLocations);
			//TODO implement an eviction policy
		}
		
		if (log.isDebugEnabled()) logCacheStats(roadLocCache);
				
		//if SELECTED request, filter them
		if (LocationLoadingRequest.SELECTED == networkRequest.getLocationLoadingRequest())
		{
			//TODO filter roadlocations, which used to be differentiated by these queries:
			/*
			case SELECTED:
				return planRepository.queryLinkedLocations(networkRequest.getPlanId()) ;
			case ALL:
				return planRepository.queryAllLocationsByPlanId(networkRequest.getPlanId()) ;
			default :
				return planRepository.queryLinkedLocations(networkRequest.getPlanId()) ;
			 */
			log.error("RoadLocations not yet being filtered for SELECTED requests");
		}
		//return results
		return roadLocations;
	}

	private Collection<NetworkAssignment> getRoadLocationNetworkAssignments(NetworkRequest networkRequest, Long wirecenterId) 
	{
		Map<Long, LocationDemand> demandByLocationIdMap = getLocationDemand(networkRequest, wirecenterId);
		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(networkRequest, wirecenterId);
		
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

		IgniteCache<Long, Collection<NetworkAssignment>> fiberSourceLocCache = ignite.getOrCreateCache(cacheConfigFiberSourcesByWCID);
		//TODO adjust the cache population strategy to one which supports hit/miss metrics
		if (null != fiberSourceLocCache && fiberSourceLocCache.containsKey(wirecenterId)) 
		{
			fiberSourceLocations = fiberSourceLocCache.get(wirecenterId);
		}
		else
		{
			fiberSourceLocations = queryFiberSources(networkRequest);
			fiberSourceLocCache.put(wirecenterId, fiberSourceLocations);
			//TODO implement an eviction policy
		}
		
		if (log.isDebugEnabled()) logCacheStats(fiberSourceLocCache);
				
		//return results
		return fiberSourceLocations;
	}

	private enum RoadEdgeMap implements OrdinalAccessor {
		gid, tlid, tnidf, tnidt, shape, edge_length
	}

	private Collection<RoadEdge> getRoadEdges(NetworkRequest networkRequest) {
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

	@Override
	protected void finalize() throws Throwable 
	{
		ignite.destroyCache(CACHE_LOCATION_DEMANDS_BY_WIRECENTER_ID);
		ignite.destroyCache(CACHE_ROAD_LOCATIONS_BY_WIRECENTER_ID);
		ignite.destroyCache(CACHE_FIBER_SOURCES_BY_WIRECENTER_ID);
		super.finalize();
	}
}
