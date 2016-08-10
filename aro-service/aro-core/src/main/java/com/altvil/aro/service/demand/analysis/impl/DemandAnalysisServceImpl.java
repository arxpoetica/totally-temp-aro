package com.altvil.aro.service.demand.analysis.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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
import com.altvil.aro.service.demand.analysis.model.ProductDemand;
import com.altvil.aro.service.demand.analysis.spi.EntityDemandMapping;
import com.altvil.aro.service.demand.analysis.spi.FairShareDemand;
import com.altvil.aro.service.demand.impl.DefaultDemandStatistic;
import com.altvil.aro.service.demand.impl.DefaultLocationDemand;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.roic.fairshare.FairShareInputs;
import com.altvil.aro.service.roic.fairshare.FairShareModel;
import com.altvil.aro.service.roic.fairshare.FairShareModelTypeEnum;
import com.altvil.aro.service.roic.fairshare.FairShareService;
import com.altvil.aro.service.roic.fairshare.NetworkTypeShare;
import com.altvil.aro.service.roic.model.NetworkProvider;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.utils.StreamUtil;

@Service
public class DemandAnalysisServceImpl implements DemandAnalysisService {

	private FairShareService fairShareService;

	@Autowired
	public DemandAnalysisServceImpl(FairShareService fairShareService) {
		super();
		this.fairShareService = fairShareService;
	}

	@Override
	public FairShareLocationDemand createFairShareLocationDemand(
			NetworkCapacityProfile profile) {

		return new CapacityBuilder(profile.getSupplierCapacity()).add(
				profile.getEntityNetworkProfiles()).build();

	}

	private class CapacityBuilder {

		private NetworkCapacity supplierCapacity;

		private Map<LocationEntityType, FairShareDemandAnalysis> demandMap = new EnumMap<>(
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

			FairShareDemandAnalysis demand = buildEffectiveNetworkDemand(
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

		public FairShareLocationDemand build() {
			return new FairShareLocationDemandImpl(demandMap);
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
			this.locationEntityType = locationEntityType;
			this.demandProfile = demandProfile;
			this.arpuMapping = arpuMapping;

			if (locationEntityType == null || demandProfile == null
					|| arpuMapping == null) {
				throw new NullPointerException();
			}

			inputBuilder = FairShareInputs.build().setNetworkTypes(
					NetworkTypeShare.build().add(NetworkType.Fiber, 1.0)
							.build());

			for (NetworkType type : demandProfile.getSupportedNetworks()) {
				inputBuilder.setProviderPenetration(type,
						demandProfile.getPenetration(type));
			}
		}

		private Map<NetworkType, Double> toNetworkStrength(
				SpeedCategory speedCategory) {
			Map<NetworkType, Double> map = new EnumMap<>(NetworkType.class);

			for (NetworkType type : demandProfile.getSupportedNetworks()) {
				map.put(type, demandProfile.getWeight(type, speedCategory));
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

		private SpiProductDemand createProductDemand(FairShareModel model,
				NetworkType type) {

			switch (locationEntityType) {
			case celltower:
				return new CellTowerProduct(type, arpuMapping, model, 64);
			case small:
				return new ProductDemandImpl(locationEntityType, type,
						arpuMapping, model, 1);
//			case medium:
//				return new ProductDemandImpl(locationEntityType, type,
//						arpuMapping, model, 4);
			case medium:
				return new BusinessProduct(LocationEntityType.medium,
						type, arpuMapping, model, 4);
			case large:
				return new BusinessProduct(LocationEntityType.large,
						type, arpuMapping, model, 32);
			case household:
			default:
				return new ProductDemandImpl(locationEntityType, type,
						arpuMapping, model, 1);
			}

		}

		public FairShareDemandAnalysis build() {

			FairShareModel model = fairShareService.createModel(
					FairShareModelTypeEnum.StandardModel, inputBuilder.build());

			Collection<SpiProductDemand> productDemands = model
					.getNetworkTypes().stream()
					.map(t -> createProductDemand(model, t))
					.collect(Collectors.toList());

			return FairShareDemandAnalysisImpl.build()
					.setArpuMapping(arpuMapping)
					.setProductDemands(productDemands)
					.setLocationEnityType(locationEntityType).build();
		}
	}

	private static class FairShareDemandAnalysisImpl implements
			FairShareDemandAnalysis {

		public static Builder build() {
			return new Builder();
		}

		public static class Builder {
			private LocationEntityType locationEntityType;
			private Collection<SpiProductDemand> demands;

			// private ArpuMapping arpuMapping;

			public Builder setArpuMapping(ArpuMapping mapping) {
				// this.arpuMapping = mapping;
				return this;
			}

			public Builder setProductDemands(
					Collection<SpiProductDemand> demands) {
				this.demands = demands;
				return this;
			}

			public Builder setLocationEnityType(LocationEntityType type) {
				this.locationEntityType = type;
				return this;
			}

			public FairShareDemandAnalysis build() {

				DemandFunction f = new ProductDemandAssembler()
						.addProductDemands(demands).assembleDemandFunction();

				return new FairShareDemandAnalysisImpl(locationEntityType,
						StreamUtil.map(demands, p -> (ProductDemand) p), f);

			}
		}

		private LocationEntityType locationEntityType;
		private Collection<ProductDemand> demands;
		private DemandFunction demandFunction;

		private FairShareDemandAnalysisImpl(
				LocationEntityType locationEntityType,
				Collection<ProductDemand> demands, DemandFunction demandFunction) {
			super();
			this.locationEntityType = locationEntityType;
			this.demands = demands;
			this.demandFunction = demandFunction;
		}

		@Override
		public FairShareDemand createFairShareDemand(EntityDemandMapping mapping) {
			return demandFunction.apply(mapping);
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

	private static class ProductDemandImpl implements SpiProductDemand {

		private LocationEntityType entityType;
		private NetworkType networkType;
		private ArpuMapping arpuMapping;
		private FairShareModel fairShareModel;
		protected double atomicUnitCounts;
		protected double demand;

		public ProductDemandImpl(LocationEntityType entityType,
				NetworkType networkType, ArpuMapping arpuMapping,
				FairShareModel fairShareModel, double atomicUnitCounts) {
			super();
			this.entityType = entityType;
			this.networkType = networkType;
			this.arpuMapping = arpuMapping;
			this.fairShareModel = fairShareModel;
			this.atomicUnitCounts = atomicUnitCounts;
			this.demand = fairShareModel.getShare(networkType);

			if (entityType == null || networkType == null
					|| arpuMapping == null || fairShareModel == null) {
				throw new NullPointerException();
			}

		}

		@Override
		public FairShareModel getFairShareModel() {
			return fairShareModel;
		}

		protected double getArpu() {
			return arpuMapping.getArpu(networkType);
		}

		@Override
		public NetworkType getNetworkType() {
			return networkType;
		}

		@Override
		public void assemble(ProductDemandAssembler assembler) {

			double arpu = getArpu();
			if (isValidArpu(arpu)) {
				assembler.addConstantRevenue(this, atomicUnitCounts, arpu,
						demand * arpu);
			}

		}

		@Override
		public LocationEntityType getLocationEntityType() {
			return entityType;
		}

		@Override
		public double getDemand() {
			return demand;
		}

	}

	private static boolean isValidArpu(double arpu) {
		return !Double.isNaN(arpu) && arpu > 0;
	}

	private static class BusinessProduct extends ProductDemandImpl {

		public BusinessProduct(LocationEntityType entityType,
				NetworkType networkType, ArpuMapping arpuMapping,
				FairShareModel fairShareModel, double atomicUnitCounts) {
			super(entityType, networkType, arpuMapping, fairShareModel,
					atomicUnitCounts);
		}

		private DemandStatistic toDemandStatistic(EntityDemandMapping mapping) {
			double revenue = mapping.getMappedRevenue();

			if (revenue == 0) {
				return DefaultDemandStatistic.ZERO_DEMAND;
			}

			double atomicCount = mapping.getMappedDemand() * atomicUnitCounts;
			return new DefaultDemandStatistic(mapping.getMappedDemand(),
					atomicCount, revenue, revenue * demand, demand);

		}

		@Override
		public void assemble(ProductDemandAssembler assembler) {
			assembler
					.add((demandMapping) -> {
						return new FairShareDemandImpl(
								toDemandStatistic(demandMapping));
					});

		}
	}

	private static class CellTowerProduct extends ProductDemandImpl {

		public CellTowerProduct(NetworkType networkType,
				ArpuMapping arpuMapping, FairShareModel fairShareModel,
				double atomicUnitCounts) {
			super(LocationEntityType.celltower, networkType, arpuMapping,
					fairShareModel, atomicUnitCounts);
		}

	}

	private static class FairShareLocationDemandImpl implements
			FairShareLocationDemand {

		private final Map<LocationEntityType, FairShareDemandAnalysis> demandMap;

		public FairShareLocationDemandImpl(
				Map<LocationEntityType, FairShareDemandAnalysis> demandMap) {
			super();
			this.demandMap = demandMap;
		}

		@Override
		public FairShareLocationDemand merge(
				Map<LocationEntityType, FairShareDemandAnalysis> map) {
			
			Map<LocationEntityType, FairShareDemandAnalysis> resultMap = new EnumMap<>(
					LocationEntityType.class);
			
			for(LocationEntityType t : demandMap.keySet()) {
				if( map.containsKey(t) ) {
					resultMap.put(t, map.get(t)) ;
				} else {
					resultMap.put(t, demandMap.get(t)) ;
				}
			}
			
			return new FairShareLocationDemandImpl(resultMap) ;
		}

		@Override
		public FairShareDemandAnalysis getEffectiveNetworkDemand(
				LocationEntityType type) {
			return demandMap.get(type);
		}

		@Override
		public DemandStatistic createDemandStatistic(
				DemandMapping demandMapping, LocationEntityType type) {
			FairShareDemandAnalysis analysis = demandMap.get(type);

			EntityDemandMapping entityMapping = demandMapping
					.getEntityDemandMapping(type);

			return analysis == null || entityMapping == null
					|| entityMapping.getMappedDemand() == 0 ? DefaultDemandStatistic.ZERO_DEMAND
					: analysis.createFairShareDemand(entityMapping)
							.getDemandStatistic();
		}

		@Override
		public LocationDemand createLocationDemand(DemandMapping demandMapping) {

			DefaultLocationDemand.Builder builder = DefaultLocationDemand
					.build();

			for (LocationEntityType type : LocationEntityType.values()) {
				builder.add(type, createDemandStatistic(demandMapping, type));
			}

			return builder.build();
		}
	}

	private interface SpiProductDemand extends ProductDemand {
		NetworkType getNetworkType();

		FairShareModel getFairShareModel();

		void assemble(ProductDemandAssembler assembler);
	}

	private interface DemandFunction extends
			Function<EntityDemandMapping, FairShareDemand> {

	}

	private static class BasicDemand {
		private double atomicUnits = 0;
		private double revenue = 0;
		private double totalRevenue = 0;

		public void add(double atomicUnits, double totalRevenue, double revenue) {
			this.atomicUnits = Math.max(atomicUnits, this.atomicUnits);
			this.revenue += revenue;
			this.totalRevenue += totalRevenue;
		}

		public boolean hasDemand() {
			return totalRevenue > 0;
		}

		private double calcPenetration() {
			return totalRevenue == 0 ? 0 : revenue / totalRevenue;
		}

		private static DemandFunction asDemandFunction(double atomicUnits,
				double totalRevenue, double penetration) {
			return (demandMapping) -> {
				double rawDemand = demandMapping.getMappedDemand();
				double adjustedRevenue = rawDemand * totalRevenue;
				return new FairShareDemandImpl(new DefaultDemandStatistic(
						rawDemand, rawDemand * atomicUnits, adjustedRevenue,
						adjustedRevenue * penetration, penetration));
			};
		}

		public DemandStatistic toDemandStatistic(EntityDemandMapping mapping) {
			double rawDemand = mapping.getMappedDemand();
			double penetration = calcPenetration();

			return new DefaultDemandStatistic(rawDemand, rawDemand
					* atomicUnits, rawDemand * totalRevenue, rawDemand
					* revenue, penetration);
		}

		public DemandFunction asDemandFunction() {

			return asDemandFunction(atomicUnits, totalRevenue,
					calcPenetration());
		}

	}

	private static class ProductDemandAssembler {
		private BasicDemand basicDemand;
		private List<DemandFunction> demandFunctions = new ArrayList<>();

		public ProductDemandAssembler() {
			basicDemand = new BasicDemand();
		}

		public ProductDemandAssembler addProductDemands(
				Collection<SpiProductDemand> demands) {
			demands.forEach(d -> d.assemble(this));
			return this;
		}

		public void add(DemandFunction demandFunction) {
			demandFunctions.add(demandFunction);
		}

		public void addConstantRevenue(SpiProductDemand productDemand,
				double atomicUnits, double totalRevenue, double revenue) {
			basicDemand.add(atomicUnits, totalRevenue, revenue);
		}

		public DemandFunction assembleDemandFunction() {

			if (basicDemand.hasDemand()) {
				demandFunctions.add(basicDemand.asDemandFunction());
			}

			if (demandFunctions.size() == 0) {
				return new BasicDemand().asDemandFunction(); // Watch Boundary
																// // no
																// Products
			} else if (demandFunctions.size() == 1) {
				return demandFunctions.iterator().next();
			} else {
				return new CompositeDemandFunction(demandFunctions);
			}
		}

	}

	private static class CompositeDemandFunction implements DemandFunction {

		private Collection<DemandFunction> demandFunctions;

		public CompositeDemandFunction(
				Collection<DemandFunction> demandFunctions) {
			super();
			this.demandFunctions = demandFunctions;
		}

		@Override
		public FairShareDemand apply(EntityDemandMapping mapping) {
			BasicDemand basicDemand = new BasicDemand();
			for (DemandFunction f : demandFunctions) {
				DemandStatistic stat = f.apply(mapping).getDemandStatistic();
				basicDemand.add(stat.getFairShareDemand(),
						stat.getAtomicUnits(), stat.getMonthlyRevenueImpact());
			}
			return new FairShareDemandImpl(
					basicDemand.toDemandStatistic(mapping));
		}

	}

	private static class FairShareDemandImpl implements FairShareDemand {

		private DemandStatistic demandStatistic;

		public FairShareDemandImpl(DemandStatistic demandStatistic) {
			super();
			this.demandStatistic = demandStatistic;
		}

		@Override
		public DemandStatistic getDemandStatistic() {
			return demandStatistic;
		}

	}	

}
