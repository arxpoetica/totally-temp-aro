package com.altvil.aro.service.network.impl;

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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.cu.ComputeUnitBuilder.ExecutionCachePolicy;
import com.altvil.aro.service.cu.ComputeUnitService;
import com.altvil.aro.service.cu.cache.impl.DefaultCacheStrategy;
import com.altvil.aro.service.cu.cache.query.CacheQuery;
import com.altvil.aro.service.cu.key.AroKey;
import com.altvil.aro.service.cu.version.VersionType;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.mapping.CompetitiveDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.entity.AroEntity;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.entity.impl.EntityFactory;
import com.altvil.aro.service.entity.mapping.LocationEntityTypeMapping;
import com.altvil.aro.service.graph.model.NetworkData;
import com.altvil.aro.service.network.AnalysisSelectionMode;
import com.altvil.aro.service.network.NetworkDataRequest;
import com.altvil.aro.service.network.NetworkDataService;
import com.altvil.aro.service.network.loader.NetworkDataLoader;
import com.altvil.aro.service.plan.NetworkAssignmentModelFactory;
import com.altvil.interfaces.CableConduitEdge;
import com.altvil.interfaces.CableConstructionEnum;
import com.altvil.interfaces.NetworkAssignment;
import com.altvil.interfaces.NetworkAssignmentModel;
import com.altvil.interfaces.RoadEdge;
import com.altvil.interfaces.RoadLocation;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.conversion.OrdinalAccessor;
import com.altvil.utils.conversion.OrdinalEntityFactory;
import org.springframework.stereotype.Service;

@Service
public class NetworkDataServiceImpl implements NetworkDataService {


	private NetworkDataLoader networkDataLoader ;


	private static final Logger LOG = LoggerFactory
			.getLogger(NetworkServiceImpl.class.getName());


	@Autowired
	private AroDemandService aroDemandService;

	private EntityFactory entityFactory = EntityFactory.FACTORY;
	private Map<Integer, CableConstructionEnum> cableConstructionEnumMap;
	@Autowired
	private NetworkDataDAO networkDataDAO;



	@PostConstruct
	void postConstruct() {
		cableConstructionEnumMap = StreamUtil
				.hashEnum(CableConstructionEnum.class);
	}


	@Override
	public NetworkData getNetworkData(NetworkDataRequest request) {

		NetworkData networkData = new NetworkData();

		Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap = getLocationDemand(request);

		networkData.setCompetitiveDemandMapping(new CompetitiveDemandMapping(
				demandByLocationIdMap));

		// TODO Simplify Locations
		networkData.setRoadLocations(getNetworkLocations(request, demandByLocationIdMap));

		networkData.setFiberSources(getFiberSourceNetworkAssignments(request));
		networkData.setRoadEdges(getRoadEdges(request));
		networkData.setCableConduitEdges(queryCableConduitEdges(request));

		return networkData;
	}


	private NetworkAssignmentModel getNetworkLocations(
			NetworkDataRequest request,
			Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap) {

		Map<Long, RoadLocation> roadLocationByLocationIdMap = getRoadLocationNetworkLocations(request);

		List<Long> selectedRoadLocations = networkDataDAO.selectedRoadLocationIds(
				request.getPlanId(), roadLocationByLocationIdMap);

		if (request.getSelectionMode() == AnalysisSelectionMode.SELECTED_LOCATIONS) {
			roadLocationByLocationIdMap.keySet().retainAll(
					selectedRoadLocations);
		}

		return networkAssignmentModel(request.getLocationEntities(), demandByLocationIdMap,
				roadLocationByLocationIdMap, selectedRoadLocations);
	}


	private NetworkAssignmentModel networkAssignmentModel(Set<LocationEntityType> locationEntities,
			Map<Long, CompetitiveLocationDemandMapping> demandByLocationIdMap,
			Map<Long, RoadLocation> roadLocationByLocationIdMap, List<Long> selectedRoadLocations) {
		NetworkAssignmentModel.Builder factory = new NetworkAssignmentModelFactory();

		roadLocationByLocationIdMap.keySet().stream().forEach(result -> {
			Long locationId = result;

			CompetitiveLocationDemandMapping ldm = demandByLocationIdMap.get(locationId);
			if (ldm != null && !ldm.isEmpty()) {
				LocationDemand locationDemand = aroDemandService.createFairShareDemandMapping(ldm)
						.getFairShareLocationDemand(SpeedCategory.cat7).createLocationDemand(ldm);
				// .createDemandByCensusBlock(ldm.getBlockId(),
				// ldm.getldm, SpeedCategory.cat7);

				AroEntity aroEntity = entityFactory.createLocationEntity(locationEntities, locationId, ldm.getBlockId(),
						ldm.getCompetitiveStrength(), locationDemand);

				NetworkAssignment na = new DefaultNetworkAssignment(aroEntity,
						roadLocationByLocationIdMap.get(locationId));

				factory.add(na, selectedRoadLocations.contains(locationId));
			}
		});
		return factory.build();
	}

	private Map<Long, CompetitiveLocationDemandMapping> getLocationDemand(
			NetworkDataRequest networkConfiguration) {

		return networkDataDAO.queryLocationDemand(
				networkConfiguration.getSelectionMode() == AnalysisSelectionMode.SELECTED_LOCATIONS,
				networkConfiguration.getLocationEntities(),
				networkConfiguration.getPlanId(),
				networkConfiguration.getYear(),
				networkConfiguration.getMrc());

	}


	private Map<Long, RoadLocation> getRoadLocationNetworkLocations(
			NetworkDataRequest networkConfiguration) {
		return networkDataDAO
				.queryRoadLocations(networkConfiguration.getServiceAreaId().get())
				.getId2location();
	}





	private Collection<NetworkAssignment> getFiberSourceNetworkAssignments(
			NetworkDataRequest networkConfiguration) {
		return networkDataDAO.queryFiberSources(networkConfiguration.getPlanId());
	}


	private Collection<RoadEdge> getRoadEdges(
			NetworkDataRequest networkConfiguration) {
		return networkDataDAO
				.getRoadEdges(networkConfiguration.getServiceAreaId().get())
				.getRoadEdges();
	}

	private enum ConduitEdgeMap implements OrdinalAccessor {
		gid, constructionType, startRatio, endRatio
	}
	
	
	private Collection<CableConduitEdge> queryCableConduitEdges(
			NetworkDataRequest networkConfiguration) {
		Collection<CableConduitEdge> existing = queryExistingCableConduitEdges(networkConfiguration) ;
		
		if( networkConfiguration.isQueryPlanConduit() ) {
			existing.addAll(queryPlanConditEdges(networkConfiguration)) ;
		}
		
		return existing ;
	}



	private Collection<CableConduitEdge> queryPlanConditEdges(NetworkDataRequest networkConfiguration) {
		return networkDataDAO
				.queryPlanConditEdges(networkConfiguration.getPlanId());

	}

	private Collection<CableConduitEdge> queryExistingCableConduitEdges(
			NetworkDataRequest networkConfiguration) {
		return networkDataDAO
				.queryExistingCableConduitEdges(networkConfiguration.getPlanId());

	}

	// private class LocationDemandAnalysisImpl implements
	// LocationDemandAnalysis {
	//
	// private Map<Long, CompetitiveLocationDemandMapping>
	// locationDemandMappingMap;
	// private LocationDemand selectedDemand;
	//
	// private Map<SpeedCategory, LocationDemand> locationDemandMap = new
	// EnumMap<>(
	// SpeedCategory.class);
	//
	// @Override
	// public CompetitiveDemandMapping getCompetitiveDemandMapping() {
	// return new CompetitiveDemandMapping(locationDemandMappingMap);
	// }
	//
	// public LocationDemandAnalysisImpl(
	// Map<Long, CompetitiveLocationDemandMapping> locationDemandMappingMap,
	// LocationDemand selectedDemand) {
	// super();
	// this.locationDemandMappingMap = locationDemandMappingMap;
	// this.selectedDemand = selectedDemand;
	// }
	//
	// @Override
	// public LocationDemand getSelectedDemand() {
	// return selectedDemand;
	// }
	//
	// @Override
	// public LocationDemand getLocationDemand(SpeedCategory speedCategory) {
	// LocationDemand ld = locationDemandMap.get(speedCategory);
	// if (ld == null) {
	// locationDemandMap.put(speedCategory,
	// ld = aggregateDemandForSpeedCategory(speedCategory));
	// }
	// return ld;
	// }
	//
	// private LocationDemand aggregateDemandForSpeedCategory(
	// SpeedCategory speedCategory) {
	//
	// Aggregator<LocationDemand> aggregator = DefaultLocationDemand
	// .demandAggregate();
	//
	// locationDemandMappingMap
	// .values()
	// .stream()
	// .map(ldm -> aroDemandService
	// .createFairShareDemandMapping(ldm)
	// .getFairShareLocationDemand(speedCategory)
	// .createLocationDemand(ldm)).forEach(ld -> {
	// aggregator.add(ld);
	// });
	//
	// return aggregator.apply();
	//
	// }
	//
	// }

}
