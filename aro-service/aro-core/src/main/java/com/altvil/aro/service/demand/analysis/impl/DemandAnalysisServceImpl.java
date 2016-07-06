package com.altvil.aro.service.demand.analysis.impl;

import java.util.Collection;
import java.util.EnumMap;
import java.util.Map;
import java.util.stream.Collectors;

import com.altvil.aro.service.demand.analysis.ArpuMapping;
import com.altvil.aro.service.demand.analysis.DemandAnalysisService;
import com.altvil.aro.service.demand.analysis.DemandProfile;
import com.altvil.aro.service.demand.analysis.EntityNetworkProfile;
import com.altvil.aro.service.demand.analysis.NetworkCapacity;
import com.altvil.aro.service.demand.analysis.NetworkCapacityProfile;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.demand.analysis.model.EffectiveLocationDemand;
import com.altvil.aro.service.demand.analysis.model.EffectiveNetworkDemand;
import com.altvil.aro.service.demand.analysis.model.ProductDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModelTypeEnum;
import com.altvil.aro.service.roic.fairshare.FairShareService;
import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;

public class DemandAnalysisServceImpl implements DemandAnalysisService {

	private FairShareService fairShareService;

	@Override
	public EffectiveLocationDemand createEffectiveLocationDemand(
			NetworkCapacityProfile profile) {

		return new CapacityBuilder(profile.getSupplierCapacity()).add(
				profile.getEntityNetworkProfiles()).build();

	}

	private class CapacityBuilder {

		private NetworkCapacity supplierCapacity;

		private Map<LocationEntityType, EffectiveNetworkDemand> demandMap = new EnumMap<>(
				LocationEntityType.class);

		public CapacityBuilder(NetworkCapacity supplierCapacity) {
			super();
			this.supplierCapacity = supplierCapacity;
		}

		public CapacityBuilder add(Collection<EntityNetworkProfile> profiles) {
			profiles.forEach(this::add);
			return this;
		}

		public CapacityBuilder add(EntityNetworkProfile entityNetworkProfile) {

			EffectiveNetworkDemand demand = buildEffectiveNetworkDemand(
					entityNetworkProfile.getLocationEntityType(),
					entityNetworkProfile.getDemandProfile(),
					entityNetworkProfile.getArpuMapping())
					.setSupplier(supplierCapacity)
					.addCompetitors(
							entityNetworkProfile.getCompetitorCapacities())
					.build();

			demandMap.put(demand.getLocationEntityType(), demand);

			return this;
		}

		public EffectiveLocationDemand build() {
			return new EffectiveLocationDemandImpl(demandMap, demandMap
					.values().stream()
					.mapToDouble(EffectiveNetworkDemand::getRevenue).sum());
		}

	}

	public EntityCapacityBuilder buildEffectiveNetworkDemand(
			LocationEntityType locationEntityType, DemandProfile demandProfile,
			ArpuMapping arpuMapping) {
		return new EntityCapacityBuilder(locationEntityType, demandProfile,
				arpuMapping);
	}

	private class EntityCapacityBuilder {

		private LocationEntityType locationEntityType;
		private DemandProfile demandProfile;
		private ArpuMapping arpuMapping;

		private FairShareInputs.Builder inputBuilder;

		public EntityCapacityBuilder(LocationEntityType locationEntityType,
				DemandProfile demandProfile, ArpuMapping arpuMapping) {
			super();
			this.demandProfile = demandProfile;
			this.arpuMapping = arpuMapping;

			inputBuilder = FairShareInputs.build();

			for (NetworkType type : demandProfile.getSupportedNetworks()) {
				inputBuilder.setProviderPenetration(type,
						demandProfile.getPenetration(type));
			}
		}

		private Map<NetworkType, Double> toNetworkStrength(
				SpeedCategory speedCategory) {
			Map<NetworkType, Double> map = new EnumMap<>(NetworkType.class);

			for (NetworkType type : demandProfile.getSupportedNetworks()) {
				inputBuilder.setProviderPenetration(type,
						demandProfile.getWeight(type, speedCategory));
			}

			return map;
		}

		private Map<NetworkType, Double> toBrandStrength(double brandStrength) {
			Map<NetworkType, Double> map = new EnumMap<>(NetworkType.class);

			for (NetworkType type : demandProfile.getSupportedNetworks()) {
				map.put(type, brandStrength);
			}

			return map;
		}

		private NetworkProvider toNetworkProvider(NetworkCapacity capacity) {
			return null;
		}

		EntityCapacityBuilder addCompetitors(
				Collection<NetworkCapacity> competitors) {
			competitors.forEach(this::addCompetitor);
			return this;
		}

		public EntityCapacityBuilder setSupplier(NetworkCapacity networkCapacity) {
			inputBuilder.setProvider(toNetworkProvider(networkCapacity),
					toBrandStrength(networkCapacity.getProviderStrength()),
					toNetworkStrength(networkCapacity.getSpeedCategory()));

			return this;
		}

		public EntityCapacityBuilder addCompetitor(
				NetworkCapacity networkCapacity) {

			inputBuilder.addCompetitor(toNetworkProvider(networkCapacity),
					toBrandStrength(networkCapacity.getProviderStrength()),
					toNetworkStrength(networkCapacity.getSpeedCategory()));

			return this;
		}

		private ProductDemand createProductDemand(FairShareModel model,
				NetworkType type) {
			return new ProductDemandImpl(locationEntityType,
					model.getShare(type), arpuMapping.getArpu(type));
		}

		public EffectiveNetworkDemand build() {

			FairShareModel model = fairShareService.createModel(
					FairShareModelTypeEnum.StandardModel, inputBuilder.build());

			Collection<ProductDemand> productDemands = model.getNetworkTypes()
					.stream().map(t -> createProductDemand(model, t))
					.collect(Collectors.toList());

			double totalRevenue = productDemands.stream()
					.mapToDouble(ProductDemand::getRevenue).sum();

			return new EffectiveNetworkDemandImpl(locationEntityType,
					productDemands, totalRevenue);
		}
	}

	private static class EffectiveNetworkDemandImpl implements
			EffectiveNetworkDemand {

		private LocationEntityType locationEntityType;
		private Collection<ProductDemand> demands;
		private double revenue;

		public EffectiveNetworkDemandImpl(
				LocationEntityType locationEntityType,
				Collection<ProductDemand> demands, double revenue) {
			super();
			this.locationEntityType = locationEntityType;
			this.demands = demands;
			this.revenue = revenue;
		}

		@Override
		public double getRevenue() {
			return revenue;
		}

		@Override
		public LocationEntityType getLocationEntityType() {
			return locationEntityType;
		}

		@Override
		public Collection<ProductDemand> getProductDemands() {
			return demands;
		}

	}

	private static class ProductDemandImpl implements ProductDemand {

		private LocationEntityType entityType;
		private double demand;
		private double arpu;
		private double revenue;

		public ProductDemandImpl(LocationEntityType entityType, double demand,
				double arpu) {
			super();
			this.entityType = entityType;
			this.demand = demand;
			this.arpu = arpu;
			this.revenue = demand * arpu;
		}

		@Override
		public double getRevenue() {
			return revenue;
		}

		@Override
		public LocationEntityType getLocationEntityType() {
			return entityType;
		}

		@Override
		public double getDemand() {
			return demand;
		}

		@Override
		public double getArpu() {
			return arpu;
		}
	}

	private static class EffectiveLocationDemandImpl implements
			EffectiveLocationDemand {

		private Map<LocationEntityType, EffectiveNetworkDemand> demandMap = new EnumMap<>(
				LocationEntityType.class);
		private double revenue;

		public EffectiveLocationDemandImpl(
				Map<LocationEntityType, EffectiveNetworkDemand> demandMap,
				double revenue) {
			super();
			this.demandMap = demandMap;
			this.revenue = revenue;
		}

		@Override
		public double getRevenue() {
			return revenue;
		}

		@Override
		public EffectiveNetworkDemand getEffectiveNetworkDemand(
				LocationEntityType type) {
			return demandMap.get(type);
		}

	}

}
