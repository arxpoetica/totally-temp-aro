package com.altvil.aro.service.network.impl;

import java.io.Serializable;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

import javax.annotation.PostConstruct;

import org.apache.ignite.IgniteCache;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.demand.impl.LocationDemandFactory;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkService;
import com.altvil.aro.service.planning.NetworkConfiguration;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;

@Service("networkService")
public class NetworkServiceImpl implements NetworkService {
	private static class PlanYearKey implements Serializable {
		private static final long serialVersionUID = 8958771852996243034L;

		protected PlanYearKey(long planId, int year) {
			this.planId = planId;
			this.year = year;
		}

		private final long planId;
		private final int year;

		@Override
		public int hashCode() {
			final int prime = 31;
			int result = 1;
			result = prime * result + (int) (planId ^ (planId >>> 32));
			result = prime * result + year;
			return result;
		}

		@Override
		public boolean equals(Object obj) {
			if (obj == null)
				return false;
			PlanYearKey other = (PlanYearKey) obj;
			return planId == other.planId && year == other.year;
		}
	}

	private static final Logger LOG = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());

	@Autowired
	private NetworkPlanRepository planRepository;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	@Value("${CACHE_LOCATION_DEMANDS_BY_PLAN_ID_AND_YEAR}")
	private String cacheLocationDemandsbyPlanIdAndYear;

	@Value("${CACHE_ROAD_LOCATIONS_BY_PLAN_ID}")
	private String cacheRoadLocationsByPlanId;

	@Value("${CACHE_FIBER_SOURCES_BY_PLAN_ID}")
	private String cacheFiberSourcesByPlanId;

	@Value("${CACHE_ROAD_EDGES_BY_PLAN_ID}")
	private String cacheRoadEdgesByPlanId;

	// private Ignite ignite;
	// private static IgniteCache<PlanYearKey, Map<Long, LocationDemand>>
	// locDemandCache;
	// private static IgniteCache<Long, Map<Long, RoadLocation>> roadLocCache;
	// private static IgniteCache<Long, Collection<NetworkAssignment>>
	// fiberSourceLocCache;
	// private static IgniteCache<Long, Collection<RoadEdge>> roadEdgesCache;

	@PostConstruct
	private void postConstruct() {
		// if (locDemandCache == null && ignite != null) {
		// // TODO MEDIUM investigate whether the multiple caches partition by
		// // wirecenter ID and naturally co-locate due to this
		// locDemandCache =
		// ignite.getOrCreateCache(cacheLocationDemandsbyPlanIdAndYear);
		// roadLocCache = ignite.getOrCreateCache(cacheRoadLocationsByPlanId);
		// fiberSourceLocCache =
		// ignite.getOrCreateCache(cacheFiberSourcesByPlanId);
		// roadEdgesCache = ignite.getOrCreateCache(cacheRoadEdgesByPlanId);
		// }
	}

	// Note: cannot autowire as Map<String,Ignite> and lookup by key, because
	// the map keys ignore bean aliases!
	// @Autowired(required=false) //NOTE the method name determines the
	// name/alias of Ignite grid which gets bound!
	// public void setNetworkServiceIgniteGrid(Ignite igniteBean) {
	// this.ignite = igniteBean;
	//
	// // NOTE:
	// postConstruct();
	// }

	@Override
	public NetworkData getNetworkData(NetworkConfiguration networkConfiguration) {

		final long planId = networkConfiguration.getPlanId();
		NetworkData networkData = new NetworkData();

		// determine wirecenter ID
		Long wcid = planRepository.queryWirecenterIdForPlanId(planId);
		if (wcid == null) {
			LOG.debug("queryWirecenteridForPlanId(" + planId
					+ ") returned null.");
		} else {
			List<Long> selectedRoadLocations = selectedRoadLocationIds(planId);
			networkData.setSelectedRoadLocationIds(selectedRoadLocations);

			// TODO MEDIUM Compare performance
			networkData
					.setFiberSources(getFiberSourceNetworkAssignments(networkConfiguration));
			networkData.setRoadLocations(getRoadLocationNetworkAssignments(
					networkConfiguration, selectedRoadLocations));
			networkData.setRoadEdges(getRoadEdges(networkConfiguration));
		}

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

	private Map<Long, LocationDemand> getLocationDemand(
			NetworkConfiguration networkConfiguration) {
		Map<Long, LocationDemand> locDemands;

		// retrieve all locations from cache by the plan's ID and the year of
		// the location demand data
		// if cache miss, populate the cache by same key with results of the
		// request

		// final PlanYearKey key = new
		// PlanYearKey(networkConfiguration.getPlanId(),
		// networkConfiguration.getYear());
		// locDemands = locDemandCache.get(key);
		locDemands = null;
		if (null == locDemands) {
			locDemands = queryLocationDemand(networkConfiguration.getLocationEntityTypes(), networkConfiguration.getPlanId(),
					networkConfiguration.getYear());
			// locDemandCache.put(key, locDemands);
			// NOTE: currently no update policy used as LocationDemand is
			// temporarily assumed immutable
		}

		// if (LOG.isDebugEnabled())
		// logCacheStats(locDemandCache);

		// if SELECTED request, filter them
		if (networkConfiguration.isFilteringRoadLocationDemandsBySelection()) {
			// TODO filter locations (were not being filtered in non-cached
			// implementation!)
			LOG.warn("LocationDemand not yet being filtered for SELECTED requests");
		}
		return locDemands;
	}

	@SuppressWarnings("unused")
	private void logCacheStats(IgniteCache<?, ?> cache) {
		// TODO MEDIUM sleep 2s+ first for accurate metrics, as metrics are
		// collected at intervals so they'll never be accurate if logged
		// instantly. Consider forking logging thread (has downsides).
		// ClusterGroup cgrp = ignite.cluster().forDataNodes(cache.getName());
		// CacheMetrics cm = cache.metrics(cgrp);
		// LOG.debug("DataNodes: " + cm.name() + " CollectStats:" +
		// cm.isStatisticsEnabled() + " Hit:" + cm.getCacheHits()
		// + " Miss:" + cm.getCacheMisses() + " Size:" + cm.getSize());

		// optional local node reporting
		// ClusterGroup lgrp = ignite.cluster().forLocal();
		// CacheMetrics lcm = cache.metrics(lgrp);
		// log.debug("** Local: " + lcm.name() + " CollectStats:" +
		// lcm.isStatisticsEnabled() + " Hit:" + lcm.getCacheHits() + " Miss:" +
		// lcm.getCacheMisses() + " Size:" + lcm.getSize());

		// optional cache memory mode peek
		// log.debug("** Peek All:" + cache.size(CachePeekMode.ALL) + " Near:" +
		// cache.size(CachePeekMode.NEAR) + " Local:" +
		// cache.localSize(CachePeekMode.ALL) + " Primary:" +
		// cache.size(CachePeekMode.PRIMARY) + " OnHeap:" +
		// cache.size(CachePeekMode.ONHEAP) + " OffHeap:" +
		// cache.size(CachePeekMode.OFFHEAP) + " Swap:" +
		// cache.size(CachePeekMode.SWAP));

		// String logString = "**Cache: " + cache.getName() + " Hit:" +
		// cm.getCacheHits() + " Miss:" + cm.getCacheMisses() + " Size:" +
		// cm.getSize();
		// log.debug(logString);
		// System.out.println(logString);
	}

	private Map<Long, LocationDemand> queryLocationDemand(Set<LocationEntityType> type, long planId, int year) {

		Map<Long, LocationDemand> map = new HashMap<>();
		planRepository.queryAllFiberDemand(planId, year).stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity).forEach(result -> {
					map.put(result.getLong(LoctationDemandMap.location_id),
							
							LocationDemandFactory.FACTORY.build(type)
							.addWithArpu(LocationEntityType.Household, 
									result.getDouble(LoctationDemandMap.household_fiber),40.0)
							.addWithArpu(LocationEntityType.Business, 
									result.getDouble(LoctationDemandMap.buesiness_fiber),65.0)
							.addWithArpu(LocationEntityType.CellTower, 
									result.getDouble(LoctationDemandMap.tower_fiber),50.0).build()) ;
							
										
						});

		return map;

	}

	private Long getWirecenterIdByPlanId(long planId) {
		return planRepository.queryWirecenterIdForPlanId(planId);
	}

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
			NetworkConfiguration networkConfiguration) {
		Map<Long, RoadLocation> roadLocations = null;

		// roadLocations = roadLocCache.get(networkConfiguration.getPlanId());
		if (null == roadLocations) {
			roadLocations = queryRoadLocations(networkConfiguration.getPlanId());
			// roadLocCache.put(networkConfiguration.getPlanId(),
			// roadLocations);
			// NOTE: currently no update policy used as RoadLocation is
			// temporarily assumed immutable
		}

		// if (LOG.isDebugEnabled())
		// logCacheStats(roadLocCache);

		return roadLocations;
	}

	private List<Long> selectedRoadLocationIds(long planId) {
		return planRepository.querySelectedLocationsByPlanId(planId).stream()
				.mapToLong(bi -> bi.longValue()).boxed()
				.collect(Collectors.toList());
	}

	// TODO Convert safeList into a predicate
	private Collection<NetworkAssignment> getRoadLocationNetworkAssignments(
			NetworkConfiguration networkConfiguration, List<Long> safeList) {
		Map<Long, LocationDemand> demandByLocationIdMap = getLocationDemand(networkConfiguration);
		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(networkConfiguration);

		if (networkConfiguration.isFilteringRoadLocationsBySelection()) {
			roadLocationByLocationIdMap.keySet().retainAll(safeList);
		}

		return toValidAssignments(roadLocationByLocationIdMap
				.keySet()
				.stream()
				.map(result -> {
					Long locationId = result;

					LocationDemand ldm = demandByLocationIdMap.get(locationId);
					if (ldm == null || ldm.getDemand() == 0) {
						// No Demand no location mapped in for fiber Linking
						return null;
					}

					AroEntity aroEntity = entityFactory.createLocationEntity(
							networkConfiguration.getLocationEntityTypes(), locationId, ldm);

					return new DefaultNetworkAssignment(aroEntity,
							roadLocationByLocationIdMap.get(locationId));
				}));
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
			NetworkConfiguration networkConfiguration) {
		Collection<NetworkAssignment> fiberSourceLocations;

		fiberSourceLocations = null; // fiberSourceLocCache.get(networkConfiguration.getPlanId());
		if (null == fiberSourceLocations) {
			fiberSourceLocations = queryFiberSources(networkConfiguration
					.getPlanId());
			// fiberSourceLocCache.put(networkConfiguration.getPlanId(),
			// fiberSourceLocations);
		}
		// NOTE: currently never updating FiberSource as it is temporarily
		// assumed immutable

		// if (LOG.isDebugEnabled())
		// logCacheStats(fiberSourceLocCache);

		// return results
		return fiberSourceLocations;
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
			NetworkConfiguration networkConfiguration) {
		Collection<RoadEdge> roadEdges;

		roadEdges = null; // roadEdgesCache.get(networkConfiguration.getPlanId());
		if (null == roadEdges) {
			roadEdges = queryRoadEdges(networkConfiguration.getPlanId());
			// roadEdgesCache.put(networkConfiguration.getPlanId(), roadEdges);
			// NOTE: currently no update policy used as RoadEdge is temporarily
			// assumed immutable
		}

		// if (LOG.isDebugEnabled())
		// logCacheStats(roadEdgesCache);

		// return results
		return roadEdges;
	}
}
