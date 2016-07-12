package com.altvil.aro.service.demand.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.demand.AroDemandService;
import com.altvil.aro.service.demand.ArpuService;
import com.altvil.aro.service.demand.DemandMapping;
import com.altvil.aro.service.demand.analysis.ArpuMapping;
import com.altvil.aro.service.demand.analysis.DemandAnalysisService;
import com.altvil.aro.service.demand.analysis.DemandProfile;
import com.altvil.aro.service.demand.analysis.EntityNetworkProfile;
import com.altvil.aro.service.demand.analysis.NetworkCapacity;
import com.altvil.aro.service.demand.analysis.NetworkCapacityProfile;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.analysis.model.FairShareLocationDemand;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.model.NetworkType;

@Service
public class AroDemandServiceImpl implements AroDemandService {

	private DemandAnalysisService demandAnalysisService;
	private ArpuService arpuService;
	private NetworkPlanRepository networkPlanRepository;
	private FairShareLocationDemand fairShareLocationDemand;

	private Map<LocationEntityType, DemandProfile> defaultDemandProfileMap = new EnumMap<>(
			LocationEntityType.class);

	private Map<Integer, FairShareLocationDemand> demandMap = new ConcurrentHashMap<>();

	@Autowired
	public AroDemandServiceImpl(DemandAnalysisService demandAnalysisService,
			ArpuService arpuService, NetworkPlanRepository networkPlanRepository) {
		super();
		this.demandAnalysisService = demandAnalysisService;
		this.arpuService = arpuService;
		this.networkPlanRepository = networkPlanRepository;
	}

	@PostConstruct
	void postConstruct() {
		initDemandProfiles();
		fairShareLocationDemand = loadEffectiveLocationDemand(SpeedCategory.cat7);
	}

	private void initDemandProfiles() {
		for (LocationEntityType type : LocationEntityType.values()) {
			defaultDemandProfileMap.put(type, createDemandProfile());
		}
	}

	private DemandProfile createDemandProfile() {
		return DemandProfileImpl.build().addPenetration(NetworkType.Fiber, 1.0)
				.add(NetworkType.Fiber, SpeedCategory.cat2, 1.0)
				.add(NetworkType.Fiber, SpeedCategory.cat3, 1.0)
				.add(NetworkType.Fiber, SpeedCategory.cat4, 2.0)
				.add(NetworkType.Fiber, SpeedCategory.cat5, 3.0)
				.add(NetworkType.Fiber, SpeedCategory.cat6, 4.0)
				.add(NetworkType.Fiber, SpeedCategory.cat7, 5.0)
				.add(NetworkType.Fiber, SpeedCategory.cat10, 5.0).build();
	}

	@Override
	public LocationDemand createDemandByCensusBlock(int censusBlockId,
			DemandMapping demandMapping) {

		return getEffectiveLocationDemand(censusBlockId).createLocationDemand(
				demandMapping);

	}

	@Override
	public LocationDemand createFullShareDemand(DemandMapping mapping) {
		return fairShareLocationDemand.createLocationDemand(mapping);
	}

	private DemandProfile getDemandProfile(LocationEntityType type) {
		return defaultDemandProfileMap.get(type);
	}

	private ArpuMapping getArpuMapping(LocationEntityType type) {
		return arpuService.getArpuMapping(type);
	}

	private EntityNetworkProfile createEntityNetworkProfile(
			LocationEntityType type, RawCapacityMapping mapping) {

		EntityNetworkProfile ep = new EntityNetworkProfile();
		ep.setLocationEntityType(type);
		ep.setDemandProfile(getDemandProfile(type));
		ep.setArpuMapping(getArpuMapping(type));
		ep.setCompetitorCapacities(mapping.getNetworkCapacties(type));

		return ep;

	}

	private Collection<EntityNetworkProfile> createEntityNetworkProfiles(
			RawCapacityMapping mapping) {
		List<EntityNetworkProfile> profiles = new ArrayList<>();

		for (LocationEntityType type : LocationEntityType.values()) {
			profiles.add(createEntityNetworkProfile(type, mapping));
		}

		return profiles;
	}

	private NetworkCapacityProfile createNetworkCapacityProfile(
			RawCapacityMapping mapping, SpeedCategory speedCategory,
			double provideStrength) {

		NetworkCapacityProfile profile = new NetworkCapacityProfile();
		profile.setSupplierCapacity(new NetworkCapacity(speedCategory,
				provideStrength));

		profile.setEntityNetworkProfiles(createEntityNetworkProfiles(mapping));

		return profile;

	}

	private NetworkCapacity createNewtorkCapacity(String providerName,
			Number category, double brandStrength) {
		return new NetworkCapacity(toSpeedCategory(category), brandStrength);
	}

	private RawCapacityMapping createRawCapacityMapping(int censusBlock) {

		List<Object[]> speeds = networkPlanRepository
				.querySpeedCategoriesElements(censusBlock);

		// TODO Convert to type-safe mapping
		Collection<NetworkCapacity> competition = speeds
				.stream()
				.map(s -> createNewtorkCapacity(s[0].toString(), (Number) s[1],
						((Number) s[3]).doubleValue()))
				.collect(Collectors.toList());

		return new RawCapacityMapping(competition);
	}

	private FairShareLocationDemand getEffectiveLocationDemand(int block) {
		FairShareLocationDemand demand = demandMap.get(block);

		if (demand == null) {
			demandMap.put(
					block,
					demand = loadEffectiveLocationDemand(block,
							SpeedCategory.cat7));
		}

		return demand;

	}

	private FairShareLocationDemand loadEffectiveLocationDemand(
			int censusBlock, SpeedCategory speedCategory) {

		RawCapacityMapping mapping = createRawCapacityMapping(censusBlock);

		return demandAnalysisService
				.createFairShareLocationDemand(createNetworkCapacityProfile(
						mapping, speedCategory, 1.0));

	}

	private FairShareLocationDemand loadEffectiveLocationDemand(
			SpeedCategory speedCategory) {

		RawCapacityMapping mapping = new RawCapacityMapping(
				new ArrayList<NetworkCapacity>());

		return demandAnalysisService
				.createFairShareLocationDemand(createNetworkCapacityProfile(
						mapping, speedCategory, 1.0));

	}

	private SpeedCategory toSpeedCategory(Number category) {

		switch (category.intValue()) {
		case 0:
		case 1:
		case 2:
			return SpeedCategory.cat2;
		case 3:
			return SpeedCategory.cat3;
		case 4:
			return SpeedCategory.cat4;
		case 5:
			return SpeedCategory.cat5;
		case 6:
			return SpeedCategory.cat6;
		case 7:
			return SpeedCategory.cat7;
		default:
			return SpeedCategory.cat10;

		}

	}

	private static class RawCapacityMapping {

		private Collection<NetworkCapacity> networkCapacties;

		public RawCapacityMapping(Collection<NetworkCapacity> networkCapacties) {
			super();
			this.networkCapacties = networkCapacties;
		}

		public Collection<NetworkCapacity> getNetworkCapacties(
				LocationEntityType type) {
			return networkCapacties;
		}
	}

	private static class DemandProfileImpl implements DemandProfile {

		public static Builder build() {
			return new Builder();
		}

		public static class Builder {
			private Map<NetworkType, Map<SpeedCategory, Double>> map = new EnumMap<>(
					NetworkType.class);
			private Map<NetworkType, Double> penetrationType = new EnumMap<>(
					NetworkType.class);

			public Builder addPenetration(NetworkType type, Double penetration) {
				penetrationType.put(type, penetration);
				return this;
			}

			public Builder add(NetworkType type, SpeedCategory category,
					double weight) {

				Map<SpeedCategory, Double> m = map.get(type);

				m = map.get(type);
				if (m == null) {
					map.put(type, m = new EnumMap<>(SpeedCategory.class));
				}

				m.put(category, weight);

				return this;
			}

			public DemandProfile build() {
				return new DemandProfileImpl(penetrationType, map);
			}
		}

		private Map<NetworkType, Double> penetrationType;
		private Map<NetworkType, Map<SpeedCategory, Double>> map;

		public DemandProfileImpl(Map<NetworkType, Double> penetrationType,
				Map<NetworkType, Map<SpeedCategory, Double>> map) {
			super();
			this.penetrationType = penetrationType;
			this.map = map;
		}

		@Override
		public Collection<NetworkType> getSupportedNetworks() {
			return penetrationType.keySet();
		}

		@Override
		public double getPenetration(NetworkType type) {
			return penetrationType.get(type);
		}

		@Override
		public double getWeight(NetworkType networkType, SpeedCategory category) {
			return map.get(networkType).get(category);
		}
	}

}
