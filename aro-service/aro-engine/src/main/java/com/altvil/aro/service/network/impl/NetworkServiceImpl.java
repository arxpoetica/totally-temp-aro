package com.altvil.aro.service.network.impl;

import java.util.Collection;
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
import com.altvil.aro.service.demand.impl.LocationDemandFactory;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.NetworkRequest;
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

	@Override
	public NetworkData getNetworkData(NetworkRequest networkRequest) {

		NetworkData networkData = new NetworkData();

		networkData.setFiberSources(getFiberSources(networkRequest));
		networkData.setRoadLocations(getLocations(networkRequest));
		networkData.setRoadEdges(getRoadEdges(networkRequest));

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

	private List<Object[]> queryLocations(
			NetworkRequest networkRequest) {
		switch (networkRequest.getLocationLoadingRequest()) {
			case SELECTED:
				return planRepository
				.queryLinkedLocations(networkRequest.getPlanId()) ;
			case ALL:
				return planRepository
				.queryAllLocationsByPlanId(networkRequest.getPlanId()) ;
			default :
				return planRepository
						.queryLinkedLocations(networkRequest.getPlanId()) ;
		}
	}
	
	private List<Object[]> queryLocationDemand(NetworkRequest networkRequest) {
		switch (networkRequest.getLocationLoadingRequest()) {
		case SELECTED:
			return planRepository
			.queryAllFiberDemand(networkRequest.getPlanId(), networkRequest.getYear()) ;
		case ALL:
			return planRepository
					.queryAllFiberDemand(networkRequest.getPlanId(), networkRequest.getYear()) ;
		default :
			return planRepository
					.queryAllFiberDemand(networkRequest.getPlanId(), networkRequest.getYear()) ;
	}
	}

	private Map<Long, LocationDemand> getLocationDemand(
			NetworkRequest networkRequest) {

		Map<Long, LocationDemand> map = new HashMap<>();
		queryLocationDemand(networkRequest)
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
	
	

	private Collection<NetworkAssignment> getLocations(
			NetworkRequest networkRequest) {

		Map<Long, LocationDemand> demandMap = getLocationDemand(networkRequest);

		return toValidAssignments(queryLocations(networkRequest)
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.map(result -> {
					try {

						long tlid = result.getLong(LocationMap.tlid);

						Long locationId = result.getLong(LocationMap.id);
						
						
						LocationDemand ldm = demandMap.get(locationId);
						if (ldm == null || ldm.getDemand() == 0) {
							// No Demand no location mapped in for fiber Linking
							return null;
						}

						AroEntity aroEntity = entityFactory
								.createLocationEntity(locationId, ldm);

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

						return new DefaultNetworkAssignment(aroEntity, rl);
					} catch (Throwable err) {
						log.error(err.getMessage(), err);
						return null;
					}
				}));
	}

	private AroEntity createAroNetworkNode(long id, int type) {
		return entityFactory.createCentralOfficeEquipment(id);
	}

	private enum FiberSourceMap implements OrdinalAccessor {
		id, gid, tlid, point, ratio, intersect_point, distance, node_type
	}

	private Collection<NetworkAssignment> getFiberSources(
			NetworkRequest networkRequest) {

		return toValidAssignments(planRepository
				.querySourceLocations(networkRequest.getPlanId())
				.stream()
				.map(OrdinalEntityFactory.FACTORY::createOrdinalEntity)
				.map(result -> {
					try {

						long tlid = result.getLong(FiberSourceMap.tlid);

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
						log.error(err.getMessage(), err);
						return null;
					}
				}));
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

}
