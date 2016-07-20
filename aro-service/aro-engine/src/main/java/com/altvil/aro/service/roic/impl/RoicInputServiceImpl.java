package com.altvil.aro.service.roic.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.model.RoicComponentInputModel;
import com.altvil.aro.persistence.repository.RoicComponentInputModelRepository;
import com.altvil.aro.service.demand.ArpuService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationDemand;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.roic.NetworkRunningCosts;
import com.altvil.aro.service.roic.RoicInputService;
import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilder;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;
import com.altvil.utils.StreamUtil;
import com.altvil.utils.reference.VolatileReference;
import com.altvil.utils.reflexive.DefaultMappedCodes;
import com.altvil.utils.reflexive.MappedCodes;

@Service
public class RoicInputServiceImpl implements RoicInputService {

	private ArpuService arpuService;
	private RoicBuilderService roicBuilderService;
	private RoicComponentInputModelRepository roicComponentInputModelRepository;

	private VolatileReference<CacheInputData> roicInputRef;

	@Autowired
	public RoicInputServiceImpl(ArpuService arpuService,
			RoicBuilderService roicBuilderService,
			RoicComponentInputModelRepository roicComponentInputModelRepository) {
		super();
		this.arpuService = arpuService;
		this.roicBuilderService = roicBuilderService;
		this.roicComponentInputModelRepository = roicComponentInputModelRepository;
	}

	@PostConstruct
	void postConstruct() {
		roicInputRef = createComponentInputs();
	}

	private MappedCodes<Integer, SpeedCategory> speedCategoryMappedCodes = DefaultMappedCodes
			.createEnumMapping(SpeedCategory.class, s -> s.ordinal() + 1)
			.flip();

	private MappedCodes<Integer, LocationEntityType> entityTypeMappedCodes = DefaultMappedCodes
			.createEnumMapping(LocationEntityType.class, s -> s.ordinal() + 1)
			.flip();

	private VolatileReference<CacheInputData> createComponentInputs() {
		return new VolatileReference<CacheInputData>(
				() -> loadCacheInputData(), 1000L * 50L * 5L);
	}

	private CacheInputData loadCacheInputData() {
		return new CacheInputData(roicComponentInputModelRepository.findAll());
	}

	private SpeedCategory normalizeSpeedCategory(SpeedCategory speedCategory) {
		switch (speedCategory) {
		case cat2:
		case cat3:
		case cat4:
		case cat5:
		case cat6:
			return SpeedCategory.cat3;
		default:
			return SpeedCategory.cat7;
		}
	}

	@Override
	public NetworkRunningCosts getNetworkRunningCosts(
			LocationDemand locationDemand, SpeedCategory speedCategory) {

		return roicInputRef.get().getMap()
				.get(normalizeSpeedCategory(speedCategory))
				.computeRunningCosts(locationDemand);
	}

	private class CacheInputData {

		private Collection<RoicComponentInputModel> models;
		private Map<SpeedCategory, RunningCostMapping> map;

		public CacheInputData(Collection<RoicComponentInputModel> models) {
			super();
			this.models = models;
			map = computeRunningCosts(models);
		}

		public Map<SpeedCategory, RunningCostMapping> computeRunningCosts(
				Collection<RoicComponentInputModel> models) {
			return models
					.stream()
					.collect(
							Collectors
									.groupingBy(RoicComponentInputModel::getSpeedCategory))
					.entrySet()
					.stream()
					.map(this::toCostMapping)
					.collect(
							Collectors.toMap(
									RunningCostMapping::getSpeedCategory,
									r -> r));

		}

		private RunningCostMapping toCostMapping(
				Map.Entry<Integer, List<RoicComponentInputModel>> e) {

			return new RunningCostMapping(
					normalizeSpeedCategory(speedCategoryMappedCodes.getDomain(e
							.getKey())), StreamUtil.hash(e.getValue(),
							m -> entityTypeMappedCodes.getDomain(m
									.getEntityType().ordinal())));

		}

		public Collection<RoicComponentInputModel> getModels() {
			return models;
		}

		public Map<SpeedCategory, RunningCostMapping> getMap() {
			return map;
		}

	}

	private static class RunningCostMapping {

		private SpeedCategory speedCategory;
		private Map<LocationEntityType, RoicComponentInputModel> map;

		public RunningCostMapping(SpeedCategory speedCategory,
				Map<LocationEntityType, RoicComponentInputModel> map) {
			super();
			this.speedCategory = speedCategory;
			this.map = map;
		}

		public SpeedCategory getSpeedCategory() {
			return speedCategory;
		}

		public NetworkRunningCosts computeRunningCosts(
				LocationDemand locationDemand) {

			double totalRevenue = 0;
			double runningCosts = 0;
			double connectionCosts = 0;

			for (LocationEntityType t : locationDemand.getEntityDemands()
					.keySet()) {
				DemandStatistic ds = locationDemand.getLocationDemand(t);
				RoicComponentInputModel model = map.get(t);
				double revenue = ds.getMonthlyRevenueImpact();
				totalRevenue += revenue;
				runningCosts += (revenue * (model.getOpexPercent() + model
						.getMaintenanceExpenses()));

				connectionCosts += model.getConnectionCost()
						* ds.getFairShareDemand();
			}

			return new NetworkRunningCostsImpl(connectionCosts, runningCosts,
					totalRevenue == 0 ? 0 : runningCosts / totalRevenue);

		}

	}

	@Override
	public RoicBuilder createRoicBuilder(PlanAnalysisReport planAnalysisReport) {
		return new RoicInputAssembler(planAnalysisReport)
				.assembleRoicModel(roicInputRef.get().getModels());
	}

	private class RoicNetworkStats {

		private PlanAnalysisReport planAnalysisReport;
		private LocationEntityType type;
		private SpeedCategory speedCategory;
		private RoicComponentInputModel inputModel;

		private double demand;
		private double totalRevenue;
		private double arpu;

		public RoicNetworkStats(PlanAnalysisReport planAnalysisReport,
				LocationEntityType type, SpeedCategory speedCategory,
				RoicComponentInputModel inputModel) {
			super();
			this.planAnalysisReport = planAnalysisReport;
			this.type = type;
			this.speedCategory = speedCategory;
			this.inputModel = inputModel;

			init();
		}

		private void init() {

			DemandStatistic ds = computeLocationDemand(speedCategory, type);

			if (ds == null) {
				throw new RuntimeException("Failed to mape DemandStatistic ");
			}

			demand = ds.getRawCoverage();
			totalRevenue = ds.getTotalRevenue() * 12;
			arpu = computeArpu(demand, totalRevenue);
			computeNetworkCost(speedCategory);

			if (arpu == Double.NaN) {
				throw new RuntimeException("Inbvalid ARPU");
			}
		}

		public SpeedCategory getSpeedCategory() {
			return speedCategory;
		}

		public RoicComponentInputModel getInputModel() {
			return inputModel;
		}

		public double getDemand() {
			return demand;
		}

		public double getArpu() {
			return arpu;
		}

		// public NetworkAnalysisType getNetworkAnalysisType() {
		// switch (speedCategory) {
		// case cat3:
		// return NetworkAnalysisType.copper;
		// default:
		// return NetworkAnalysisType.fiber;
		// }
		// }

		private NetworkType getNetworkType() {
			switch (speedCategory) {
			case cat3:
				return NetworkType.Copper;
			default:
				return NetworkType.Fiber;
			}
		}

		private double computeArpu(double demand, double revenue) {
			switch (type) {
			case MediumBusiness:
			case LargeBusiness:
				return demand == 0 ? 0 : revenue / demand;
			default:
				return arpuService.getArpuMapping(type).getArpu(
						getNetworkType()) * 12;
			}
		}

		private double computeNetworkCost(SpeedCategory speedCategory) {
			switch (speedCategory) {
			case cat3:
				return 0;
			default:
				return planAnalysisReport.getPriceModel().getTotalCost();
			}
		}

		private double getPenetration(DemandTypeEnum demandType) {
			return planAnalysisReport.getDemandSummary()
					.getNetworkDemand(demandType).getLocationDemand()
					.getLocationDemand(type).getPenetration();

		}

		public NetworkPenetration getNetworkPenetration() {

			switch (speedCategory) {
			case cat3:
				return new DefaultNetworkPenetration(
						inputModel.getPenetrationStart(),
						getPenetration(DemandTypeEnum.original_demand),
						inputModel.getPenetrationRate());

			default:
				return new DefaultNetworkPenetration(
						inputModel.getPenetrationStart(),
						getPenetration(DemandTypeEnum.planned_demand),
						inputModel.getPenetrationRate());

			}
		}

		private DemandStatistic computeLocationDemand(
				SpeedCategory speedCategory, LocationEntityType type) {
			switch (speedCategory) {
			case cat3:
				return planAnalysisReport.getDemandSummary()
						.getNetworkDemand(DemandTypeEnum.new_demand)
						.getLocationDemand().getLocationDemand(type);
			default:
				return planAnalysisReport.getDemandSummary()
						.getNetworkDemand(DemandTypeEnum.planned_demand)
						.getLocationDemand().getLocationDemand(type);
			}
		}
	}

	//
	//
	//

	private class RoicInputAssembler {

		private PlanAnalysisReport planAnalysisReport;

		public RoicInputAssembler(PlanAnalysisReport planAnalysisReport) {
			super();
			this.planAnalysisReport = planAnalysisReport;
		}

		public RoicBuilder assembleRoicModel(
				Collection<RoicComponentInputModel> inputs) {
			Map<SpeedCategory, List<ComponentInput>> map = toMappedComponents(inputs);

			RoicBuilder builder = roicBuilderService.buildModel();

			map.entrySet().stream()
					.map(e -> toRoicInputs(e.getKey(), e.getValue()))
					.forEach(ri -> {
						builder.addRoicInputs(ri);
					});

			return builder;

		}

		private double getNetworkCost(SpeedCategory speedCategory) {
			switch (speedCategory) {
			case cat3:
				return 0;
			default:
				return planAnalysisReport.getPriceModel().getTotalCost();
			}
		}

		private NetworkAnalysisType toNetworkAnalysisType(
				SpeedCategory speedCategory) {
			switch (speedCategory) {
			case cat3:
				return NetworkAnalysisType.copper;
			default:
				return NetworkAnalysisType.fiber;
			}
		}

		private RoicInputs toRoicInputs(SpeedCategory speedCategory,
				Collection<ComponentInput> inputs) {

			RoicInputs ri = new RoicInputs();
			ri.setComponentInputs(inputs);
			ri.setFixedCost(getNetworkCost(speedCategory));
			ri.setType(toNetworkAnalysisType(speedCategory));

			return ri;
		}

		private Map<SpeedCategory, List<ComponentInput>> toMappedComponents(
				Collection<RoicComponentInputModel> inputs) {

			Map<SpeedCategory, List<ComponentInput>> result = new EnumMap<>(
					SpeedCategory.class);

			inputs.forEach(input -> {
				RoicNetworkStats stats = createNetworkStats(input);
				List<ComponentInput> list = result.get(stats.getSpeedCategory());
				if (list == null) {
					result.put(stats.getSpeedCategory(),
							list = new ArrayList<>());
				}

				list.add(toComponentInput(stats));

			});

			return result;

		}

		private RoicNetworkStats createNetworkStats(
				RoicComponentInputModel inputModel) {

			return new RoicNetworkStats(planAnalysisReport,
					entityTypeMappedCodes.getDomain(inputModel.getEntityType()
							.ordinal()),
					speedCategoryMappedCodes.getDomain(inputModel
							.getSpeedCategory()), inputModel);

		}

		private ComponentInput toComponentInput(RoicNetworkStats stats) {

			RoicComponentInputModel model = stats.getInputModel();

			return ComponentInput.build()
					.setComponentType(model.getEntityType())
					.setEntityCount(stats.getDemand()).setArpu(stats.getArpu())
					.setNetworkPenetration(stats.getNetworkPenetration())
					.setChurnRate(model.getChurnRate())
					.setChurnRateDecrease(model.getChurnRate())
					.setEntityGrowth(model.getEntityGrowth())
					.setOpexPercent(model.getOpexPercent())
					.setMaintenanceExpenses(model.getMaintenanceExpenses())
					.setConnectionCost(model.getConnectionCost()).assemble();

		}

	}

	private static class NetworkRunningCostsImpl implements NetworkRunningCosts {

		private double totalConnectionCosts;
		private double totalRunningCosts;
		private double runningCostAsPercent;

		public NetworkRunningCostsImpl(double totalConnectionCosts,
				double totalRunningCosts, double runningCostAsPercent) {
			super();
			this.totalConnectionCosts = totalConnectionCosts;
			this.totalRunningCosts = totalRunningCosts;
			this.runningCostAsPercent = runningCostAsPercent;
		}

		@Override
		public double getTotalConnectionCosts() {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public double getTotalRunningCosts() {
			// TODO Auto-generated method stub
			return 0;
		}

		@Override
		public double getRunningCostAsPercent() {
			// TODO Auto-generated method stub
			return 0;
		}

	}

}
