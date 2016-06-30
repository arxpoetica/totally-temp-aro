package com.altvil.aro.service.network.impl;

import java.util.ArrayList;
import java.util.Collection;
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
import com.altvil.aro.service.demand.impl.LocationDemandFactory;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.LocationSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;

@Service
public class NetworkDataServiceImpl implements NetworkDataService {

	private static final Logger LOG = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());

	@Autowired
	private NetworkPlanRepository planRepository;

	private EntityFactory entityFactory = EntityFactory.FACTORY;

	@Override
	public NetworkData getNetworkData(NetworkDataRequest request) {
		// final long planId = networkConfiguration.getPlanId();
		NetworkData networkData = new NetworkData();

		Map<Long, LocationDemand> demandByLocationIdMap = getLocationDemand(request);
		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(request);
		List<Long> selectedRoadLocations = selectedRoadLocationIds(
				request.getPlanId(), roadLocationByLocationIdMap);

		// TODO MEDIUM Compare performance
		networkData.setFiberSources(getFiberSourceNetworkAssignments(request));

		if (request.getSelectionMode() == LocationSelectionMode.SELECTED_LOCATIONS) {
			roadLocationByLocationIdMap.keySet().retainAll(
					selectedRoadLocations);
		}

		Collection<NetworkAssignment> roadLocations = toValidAssignments(roadLocationByLocationIdMap
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
							request.getLocationEntities(), locationId, ldm);

					return new DefaultNetworkAssignment(aroEntity,
							roadLocationByLocationIdMap.get(locationId));
				}));

		networkData.setRoadLocations(roadLocations);

		networkData.setRoadEdges(getRoadEdges(request));
		networkData.setSelectedRoadLocationIds(selectedRoadLocations);

		return networkData;
	}

	public NetworkData _getNetworkData(NetworkDataRequest networkConfiguration) {
		// final long planId = networkConfiguration.getPlanId();
		NetworkData networkData = new NetworkData();

		Map<Long, LocationDemand> demandByLocationIdMap = getLocationDemand(networkConfiguration);
		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(networkConfiguration);
		List<Long> selectedRoadLocations = selectedRoadLocationIds(
				networkConfiguration.getPlanId(), roadLocationByLocationIdMap);

		// TODO MEDIUM Compare performance
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

					LocationDemand ldm = demandByLocationIdMap.get(locationId);
					if (ldm == null || ldm.getDemand() == 0) {
						// No Demand no location mapped in for fiber Linking
						return null;
					}

					AroEntity aroEntity = entityFactory.createLocationEntity(
							networkConfiguration.getLocationEntities(),
							locationId, ldm);

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

	private enum LoctationDemandMap implements OrdinalAccessor {
		location_id, business_fiber, bussiness_spend, tower_fiber, tower_spend, household_fiber, household_spend
	}

	private Map<Long, LocationDemand> getLocationDemand(
			NetworkDataRequest networkConfiguration) {

		return queryLocationDemand(
				networkConfiguration.getSelectionMode() == LocationSelectionMode.SELECTED_LOCATIONS,
				networkConfiguration.getLocationEntities(),
				networkConfiguration.getPlanId(),
				networkConfiguration.getYear());

	}

	private Map<Long, LocationDemand> queryLocationDemand(
			boolean isFilteringRoadLocationDemandsBySelection,
			Set<LocationEntityType> type, long planId, int year) {

		List<Object[]> demands = isFilteringRoadLocationDemandsBySelection ? planRepository
				.queryFiberDemand(planId, year) : planRepository
				.queryAllFiberDemand(planId, year);

		Map<Long, LocationDemand> map = new HashMap<>();
		demands.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.forEach(
						result -> {
							map.put(result
									.getLong(LoctationDemandMap.location_id),

									LocationDemandFactory.FACTORY
											.build(type)
											.addWithRevenue(
													LocationEntityType.Household,
													result.getDouble(LoctationDemandMap.household_fiber),
													result.getDouble(LoctationDemandMap.household_spend) * 0.3)
											.addWithRevenue(
													LocationEntityType.Business,
													result.getDouble(LoctationDemandMap.business_fiber),
													result.getDouble(LoctationDemandMap.bussiness_spend) * 0.3)
											.addWithRevenue(
													LocationEntityType.CellTower,
													result.getDouble(LoctationDemandMap.tower_fiber),
													result.getDouble(LoctationDemandMap.tower_spend) * 0.3)
											.build());

						});

		return map;

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

}