package com.altvil.aro.service.network.impl;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.interfaces.*;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class NetworkDataDAO{
    private static final Logger LOG = LoggerFactory
            .getLogger(NetworkDataDAO.class.getName());
    @Autowired
    private NetworkPlanRepository planRepository;

    private Map<Integer, CableConstructionEnum> cableConstructionEnumMap;

    private EntityFactory entityFactory = EntityFactory.FACTORY;

    @PostConstruct
    void postConstruct() {
        cableConstructionEnumMap = StreamUtil
                .hashEnum(CableConstructionEnum.class);
    }

    public Map<Long, CompetitiveLocationDemandMapping> queryLocationDemand(
            boolean isFilteringRoadLocationDemandsBySelection,
            Set<LocationEntityType> selectedTypes, long planId, int year, double mrc) {

        return assembleMapping(
                (isFilteringRoadLocationDemandsBySelection ? queryFiberDemand(planId, year, mrc)
                        : queryAllFiberDemand(planId, year, mrc)),
                selectedTypes);

    }

    private List<Object[]> queryAllFiberDemand(long planId, int year, double mrc) {
        return planRepository.queryAllFiberDemand(planId, year, mrc);
    }

    private List<Object[]> queryFiberDemand(long planId, int year, double mrc) {
        return planRepository.queryFiberDemand(
                planId, year, mrc);
    }

    private Map<Long, CompetitiveLocationDemandMapping> assembleMapping(
            List<Object[]> entityDemands, Set<LocationEntityType> selectedTypes) {
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

                            if (selectedTypes.contains(lt)) {
                                ldm.add(lt,
                                        d.getDouble(EntityDemandMap.count),
                                        d.getDouble(EntityDemandMap.monthly_spend));
                            }

                        });

        return map;
    }

    public Map<Long, RoadLocation> queryRoadLocations(long planId) {
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
                                        .build();

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

    public Collection<NetworkAssignment> queryFiberSources(long planId) {

        return planRepository
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
                }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    public Collection<RoadEdge> getRoadEdges(
            int serviceAreaId) {
        return planRepository
                .queryRoadEdgesbyServiceAreaId(serviceAreaId)
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
