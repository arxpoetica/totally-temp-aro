package com.altvil.aro.service.demand.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
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
import com.altvil.aro.service.demand.analysis.model.FairShareDemandAnalysis;
import com.altvil.aro.service.demand.analysis.model.FairShareLocationDemand;
import com.altvil.aro.service.demand.mapping.CompetitiveLocationDemandMapping;
import com.altvil.aro.service.demand.mapping.CompetitiveMapping;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.utils.func.Aggregator;

@Service
public class AroDemandServiceImpl implements AroDemandService {

	private DemandAnalysisService demandAnalysisService;
	private ArpuService arpuService;
	private NetworkPlanRepository networkPlanRepository;
	private FairShareLocationDemand fairShareLocationDemand;

	private Map<LocationEntityType, DemandProfile> defaultDemandProfileMap = new EnumMap<>(
			LocationEntityType.class);

	private Map<Double, FairShareDemandMapping> competitiveMap = new ConcurrentHashMap<>();
	private Map<Integer, DefaultFairShareDemandMapping> demandMap = new ConcurrentHashMap<>();

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
	public LocationDemand aggregateDemandForSpeedCategory(
			Collection<CompetitiveLocationDemandMapping> demandMapping,
			SpeedCategory speedCategory) {

		Aggregator<LocationDemand> aggregator = DefaultLocationDemand
				.demandAggregate();

		demandMapping
				.stream()
				.map(ldm -> this.createFairShareDemandMapping(ldm)
						.getFairShareLocationDemand(speedCategory)
						.createLocationDemand(ldm)).forEach(ld -> {
					aggregator.add(ld);
				});

		return aggregator.apply();

	}

	@Override
	public FairShareDemandMapping createFairShareDemandMapping(
			CompetitiveMapping competiveMapping) {

		FairShareDemandMapping fsd = getEffectiveLocationDemand(competiveMapping
				.getCensusBlockId());

		if (competiveMapping.getCompetitiveStrength() == 0) {
			return fsd;
		}

		FairShareDemandMapping strengthFairShare = getEffectiveLocationDemandByStrength(competiveMapping
				.getCompetitiveStrength());

		return CompositeFairShareDemandMapping.create(fsd, strengthFairShare);

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

	private RawCapacityMapping createRawCapacityMappingForStrength(
			double strength) {

		return new RawCapacityMapping(
				Collections.singleton(new NetworkCapacity(SpeedCategory.cat7,
						strength)));

	}

	private FairShareDemandMapping getEffectiveLocationDemandByStrength(
			Double strength) {

		FairShareDemandMapping demand = competitiveMap.get(strength);

		if (demand == null) {
			competitiveMap.put(strength,
					demand = new DefaultFairShareDemandMapping(
							createRawCapacityMappingForStrength(strength)));
		}

		return demand;

	}

	private FairShareDemandMapping getEffectiveLocationDemand(int block) {
		DefaultFairShareDemandMapping demand = demandMap.get(block);

		if (demand == null) {
			demandMap.put(block, demand = new DefaultFairShareDemandMapping(
					createRawCapacityMapping(block)));
		}

		return demand;

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

	private class DefaultFairShareDemandMapping implements
			FairShareDemandMapping {
		private RawCapacityMapping rawCapacityMapping;
		private Map<SpeedCategory, FairShareLocationDemand> demandMap = Collections
				.synchronizedMap(new EnumMap<>(SpeedCategory.class));

		public DefaultFairShareDemandMapping(
				RawCapacityMapping rawCapacityMapping) {
			super();
			this.rawCapacityMapping = rawCapacityMapping;
		}

		@Override
		public FairShareLocationDemand getFairShareLocationDemand(
				SpeedCategory speedCategory) {
			FairShareLocationDemand ld = demandMap.get(speedCategory);
			if (ld == null) {
				ld = demandAnalysisService
						.createFairShareLocationDemand(createNetworkCapacityProfile(
								rawCapacityMapping, speedCategory, 1.0));
				demandMap.put(speedCategory, ld);
			}

			return ld;

		}

	}

	private static class CompositeFairShareDemandMapping implements
			FairShareDemandMapping {

		public static FairShareDemandMapping create(
				FairShareDemandMapping cbFairShare,
				FairShareDemandMapping strengthFairShare) {

			Map<LocationEntityType, FairShareDemandMapping> overrrideMapping = new EnumMap<>(
					LocationEntityType.class);

			overrrideMapping.put(LocationEntityType.large,
					strengthFairShare);
			overrrideMapping.put(LocationEntityType.celltower,
					strengthFairShare);

			return new CompositeFairShareDemandMapping(cbFairShare,
					overrrideMapping);

		}

		private final FairShareDemandMapping primaryMapping;
		private final Map<LocationEntityType, FairShareDemandMapping> overrideMap;

		private Map<SpeedCategory, FairShareLocationDemand> demandMap = new EnumMap<>(
				SpeedCategory.class);

		public CompositeFairShareDemandMapping(
				FairShareDemandMapping primaryMapping,
				Map<LocationEntityType, FairShareDemandMapping> overrideMap) {
			super();
			this.primaryMapping = primaryMapping;
			this.overrideMap = overrideMap;
		}

		private Map<LocationEntityType, FairShareDemandAnalysis> createOverrides(
				SpeedCategory speedCategory) {
			Map<LocationEntityType, FairShareDemandAnalysis> overrides = new EnumMap<>(
					LocationEntityType.class);

			for (Map.Entry<LocationEntityType, FairShareDemandMapping> e : overrideMap
					.entrySet()) {
				overrides.put(e.getKey(), e.getValue()
						.getFairShareLocationDemand(speedCategory)
						.getEffectiveNetworkDemand(e.getKey()));
			}
			return overrides;
		}

		private FairShareLocationDemand create(SpeedCategory speedCategory) {
			return primaryMapping.getFairShareLocationDemand(speedCategory)
					.merge(createOverrides(speedCategory));
		}

		@Override
		public FairShareLocationDemand getFairShareLocationDemand(
				SpeedCategory speedCategory) {

			FairShareLocationDemand fsd = demandMap.get(speedCategory);

			if (fsd == null) {
				demandMap.put(speedCategory, fsd = create(speedCategory));
			}

			return fsd;

		}

	}

}
