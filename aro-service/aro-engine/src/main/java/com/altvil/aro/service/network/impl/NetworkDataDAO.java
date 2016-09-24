package com.altvil.aro.service.network.impl;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.cu.ComputeServiceApi;
import com.altvil.aro.service.cu.ComputeUnit;
import com.altvil.aro.service.cu.ComputeUnitService;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.execute.Priority;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.network.model.ServiceAreaLocationDemand;
import com.altvil.aro.service.network.model.ServiceAreaRoadEdges;
import com.altvil.aro.service.network.model.ServiceAreaRoadLocations;
import com.altvil.interfaces.*;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;

import java.io.Serializable;
import java.math.BigInteger;
import java.util.*;
import java.util.stream.Collectors;

import static com.altvil.aro.service.cu.ComputeUnitBuilder.ExecutionCachePolicy.MEMORY;
import static com.altvil.aro.service.cu.ComputeUnitBuilder.ExecutionCachePolicy.PERSISTENCE;

@Service
public class NetworkDataDAO implements ComputeServiceApi{
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


    @SuppressWarnings("unchecked")
	@PostConstruct
    void postConstruct() {
        cableConstructionEnumMap = StreamUtil
                .hashEnum(CableConstructionEnum.class);
        serviceAreaRoadEdges = computeUnitService
                .build(ServiceAreaRoadEdges.class, this.getClass())
                .setName("service_area_road_edges")
                .setCacheMemorySize(100)
                .setExecutionCachePolicies(EnumSet.of(MEMORY, PERSISTENCE))
                .setVersionTypes(EnumSet.of(VersionType.SERVICE))
                .setCacheLoaderFunc(
                        (cacheQuery) -> () -> _getRoadEdges(
                                cacheQuery.getServiceAreaId(),
                                cacheQuery.getParam("statesFips", Collection.class)))
                .build();
        serviceAreaRoadLocations = computeUnitService
                .build( ServiceAreaRoadLocations.class, this.getClass())
                .setName("service_area_road_locations")
                .setCacheMemorySize(100)
                .setExecutionCachePolicies(EnumSet.of(MEMORY, PERSISTENCE))
                .setVersionTypes(EnumSet.of(VersionType.SERVICE))
                .setCacheLoaderFunc(
                        (cacheQuery) -> () -> _queryRoadLocations(
                                cacheQuery.getServiceAreaId(),
                                cacheQuery.getParam("states", Collection.class),
                                cacheQuery.getParam("statesFips", Collection.class)


                        ))
                .build();
        locationDemand = computeUnitService
                .build( ServiceAreaLocationDemand.class, this.getClass())
                .setName("location_demand")
                .setCacheMemorySize(100)
                .setExecutionCachePolicies(EnumSet.of(MEMORY, PERSISTENCE))
                .setVersionTypes(EnumSet.of(VersionType.SERVICE))
                .setCacheLoaderFunc(
                        (cacheQuery) -> () -> _queryFiberDemand(
                                cacheQuery.getServiceAreaId(),
                                cacheQuery.getParam("year", Integer.class),
                                cacheQuery.getParam("mrc", Double.class),
                                cacheQuery.getParam("selectedTypes", Set.class),
                                cacheQuery.getParam("states", Collection.class)))
                .build();

    }


    public Map<Long, CompetitiveLocationDemandMapping> queryLocationDemand(
            boolean isFilteringRoadLocationDemandsBySelection,
            Set<LocationEntityType> selectedTypes, int serviceAreaId, long planId, int year, double mrc, Collection<String> statesUSPS) {

        Map<Long, CompetitiveLocationDemandMapping> locationDemand = queryFiberDemand(serviceAreaId, year, mrc, selectedTypes, statesUSPS).getDemandMapping();
        if(isFilteringRoadLocationDemandsBySelection){
            Set<Long> selectedRoadLocationIds = planRepository.querySelectedLocationsByPlanId(planId).stream().map(BigInteger::longValue).collect(Collectors.toSet());
            return locationDemand.entrySet()
                    .stream()
                    .filter(entry -> selectedRoadLocationIds.contains(entry.getKey()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        }else{
            return locationDemand;
        }


    }

    private ServiceAreaLocationDemand queryFiberDemand(int serviceAreaId, int year, double mrc, Set<LocationEntityType> selectedTypes, Collection<String> states) {
        return locationDemand.gridLoad(Priority.HIGH, CacheQuery.build(serviceAreaId)
                .add("year", year)
                .add("mrc", mrc)
                .add("selectedTypes", new HashSet<>(selectedTypes))
                .add("states", (Serializable)states)
                .build());

    }


    private ServiceAreaLocationDemand _queryFiberDemand(int serviceAreaId, int year, double mrc, Set<LocationEntityType> selectedTypes, Collection<String> stateUsps) {
        return  ServiceAreaLocationDemand.build()
                .setMapping(assembleMapping(planRepository.queryAllFiberDemand(serviceAreaId, year, mrc, stateUsps.iterator().next())))
                .filterBySelectedTypes(selectedTypes)
                .build();
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

                            ldm.add(lt,
                                    d.getDouble(EntityDemandMap.count),
                                    d.getDouble(EntityDemandMap.monthly_spend));


                        });

        return map;
    }

    public ServiceAreaRoadLocations queryRoadLocations(int serviceAreaId, Collection<String> states, Collection<String> statesFips) {
        return serviceAreaRoadLocations.gridLoad(Priority.HIGH, CacheQuery.build(serviceAreaId)
                .add("states", (Serializable) states)
                .add("statesFips", (Serializable)statesFips)
                .build());
    }

    private ServiceAreaRoadLocations _queryRoadLocations(int serviceAreaId, Collection<String> states, Collection<String> statesFips) {
        Map<Long, RoadLocation> roadLocationsMap = new HashMap<>();
        planRepository
                .queryAllLocationsByServiceAreaId(serviceAreaId, states.iterator().next(), statesFips.iterator().next())
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

    public Collection<NetworkAssignment> queryFiberSources(long planId, Collection<String> statesUSPS) {

        return planRepository
                .querySourceLocations(planId, statesUSPS.iterator().next())
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

    public ServiceAreaRoadEdges getRoadEdges(
            int serviceAreaId, Collection<String> stateFips) {
        return serviceAreaRoadEdges.gridLoad(Priority.HIGH, CacheQuery.build(serviceAreaId)
                .add("stateFips", (Serializable) stateFips)
                        .build());
    }


    private ServiceAreaRoadEdges _getRoadEdges(
            int serviceAreaId, Collection<String> stateFips) {
        return new ServiceAreaRoadEdges(
                planRepository
                .queryRoadEdgesbyServiceAreaId(serviceAreaId, stateFips.iterator().next())
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
                }).filter(e -> e != null).collect(Collectors.toList())
        );
    }



    public List<Long> selectedRoadLocationIds(long planId,
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



    private LocationEntityType toLocationEntityType(int entityTypeCode) {
        return LocationEntityTypeMapping.MAPPING
                .toLocationEntityType(entityTypeCode);
    }

    private AroEntity createAroNetworkNode(long id, int type) {
        return entityFactory.createCentralOfficeEquipment(id);
    }


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
    public Collection<CableConduitEdge> queryExistingCableConduitEdges(
            long planId) {
        return planRepository
                .queryConduitSections(planId)
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


    public Collection<String> getServiceAreaStates(Integer serviceAreaId) {
        return planRepository.getServiceAreaStates(serviceAreaId);
    }

    public Collection<String> getServiceAreaStatesFips(Integer serviceAreaId) {
        return planRepository.getServiceAreaFips(serviceAreaId);
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
