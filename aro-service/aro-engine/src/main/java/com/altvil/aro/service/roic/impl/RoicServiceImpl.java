package com.altvil.aro.service.roic.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.DemandTypeEnum;
import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.RoicComponentInputModel;
import com.altvil.aro.model.WirecenterPlan;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.RoicComponentInputModelRepository;
import com.altvil.aro.service.demand.ArpuService;
import com.altvil.aro.service.demand.analysis.SpeedCategory;
import com.altvil.aro.service.entity.DemandStatistic;
import com.altvil.aro.service.entity.LocationEntityType;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.report.PlanAnalysisReportService;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.RoicConstants;
import com.altvil.aro.service.roic.analysis.builder.component.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilder;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.NetworkPenetration;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;
import com.altvil.utils.reference.VolatileReference;
import com.altvil.utils.reflexive.DefaultMappedCodes;
import com.altvil.utils.reflexive.MappedCodes;

@Service
public class RoicServiceImpl implements RoicService {

	private static final Logger log = LoggerFactory
			.getLogger(RoicServiceImpl.class.getName());

	private RoicBuilderService roicBuilderService;
	private NetworkPlanRepository planRepostory;
	private NetworkNodeRepository networkNodeRepository;
	private NetworkReportService costService;
	private RoicComponentInputModelRepository roicComponentInputModelRepository;
	private ArpuService arpuService;
	private NetworkReportService networkReportService;

	private SuperSimpleCache cache;
	VolatileReference<Collection<RoicComponentInputModel>> roicInputRef;

	@Autowired
	public RoicServiceImpl(
			RoicBuilderService roicBuilderService,
			NetworkPlanRepository planRepostory,
			NetworkNodeRepository networkNodeRepository,
			NetworkReportService costService,
			RoicComponentInputModelRepository roicComponentInputModelRepository,
			ArpuService arpuService, NetworkReportService networkReportService) {
		super();
		this.roicBuilderService = roicBuilderService;
		this.planRepostory = planRepostory;
		this.networkNodeRepository = networkNodeRepository;
		this.costService = costService;
		this.roicComponentInputModelRepository = roicComponentInputModelRepository;
		this.arpuService = arpuService;
		this.networkReportService = networkReportService;

		cache = new SuperSimpleCache();
		roicInputRef = createComponentInputs();
	}

	private VolatileReference<Collection<RoicComponentInputModel>> createComponentInputs() {
		return new VolatileReference<Collection<RoicComponentInputModel>>(
				() -> roicComponentInputModelRepository.findAll(),
				1000L * 50L * 5L);
	}

	@Override
	public void invalidatePlan(long planId) {
		cache.invalidate(planId);
	}

	@Override
	public RoicModel getRoicModel(long planId) {

		NetworkPlan plan = planRepostory.findOne(planId);

		Optional<RoicModel> m = (plan instanceof MasterPlan) ? getMasterRoicModel((MasterPlan) plan)
				: getWirecenterRoicModel((WirecenterPlan) plan);

		return m.isPresent() ? m.get() : null;
	}

	private <T extends NetworkPlan> Optional<RoicModel> getRoicModel(T plan,
			Supplier<Optional<RoicModel>> s) {
		Long planId = plan.getId();

		Optional<RoicModel> model = cache.get(planId);
		if (model == null) {
			cache.write(planId, model = s.get());
		}

		return model;
	}

	private Optional<RoicModel> getMasterRoicModel(MasterPlan plan) {
		return getRoicModel(plan, () -> loadMasterRoicModel(plan));
	}

	private Optional<RoicModel> getWirecenterRoicModel(WirecenterPlan plan) {
		return getRoicModel(plan, () -> Optional.of(loadRoic(plan)));
	}

	private Optional<RoicModel> loadMasterRoicModel(MasterPlan plan) {

		Collection<RoicModel> models = planRepostory
				.queryChildPlans(plan.getId()).stream().map(this::loadRoic)
				.filter(r -> r != null).collect(Collectors.toList());

		if (models.size() == 0) {
			return Optional.empty();
		}

		return Optional.of(roicBuilderService.aggregate().addAll(models).sum());
	}

	private RoicModel loadRoic(WirecenterPlan plan) {

		try {

			long planId = plan.getId();

			PlanAnalysisReport report = networkReportService
					.loadSummarizedPlan(planId).getPlanAnalysisReport();

			// RoicInputs copperInputs = RoicInputs.updateInputs(
			// RoicConstants.CopperInputs, getTotalDemand(planId), 0);
			//
			// RoicInputs fiberInputs = RoicInputs.updateInputs(
			// RoicConstants.FiberConstants, getLocationDemand(planId),
			// getCapex(planId));
			//
			// return roicBuilderService.buildModel()
			// .setAnalysisPeriod(new AnalysisPeriod(2016, 15))
			// .addRoicInputs(copperInputs).addRoicInputs(fiberInputs)
			// .build();

			return new RoicInputAssembler(report)
					.assembleRoicModel(roicInputRef.get())
					.setAnalysisPeriod(new AnalysisPeriod(2016, 15)).build();

		} catch (Throwable err) {
			log.error(err.getMessage(), err);
			return null;
		}

	}

	private static class SuperSimpleCache {

		private Map<Long, ObjectHolder<Optional<RoicModel>>> map = new HashMap<>();
		private Timer timer;

		public SuperSimpleCache() {
			timer = new Timer();
			timer.scheduleAtFixedRate(reaper, 1000L * 60L, 1000L * 60);
		}

		private TimerTask reaper = new TimerTask() {
			@Override
			public void run() {
				reap();
			}
		};

		private synchronized void reap() {
			long time = System.currentTimeMillis();
			for (Long id : new ArrayList<>(map.keySet())) {
				ObjectHolder<Optional<RoicModel>> m = map.get(id);
				if (m.isStale(time)) {
					map.remove(id);
				}
			}
		}

		public synchronized Optional<RoicModel> get(Long id) {
			ObjectHolder<Optional<RoicModel>> h = map.get(id);
			return (h == null) ? null : h.value;
		}

		public synchronized void write(Long id, Optional<RoicModel> model) {
			map.put(id, new ObjectHolder<>(model));
		}

		public synchronized void invalidate(Long planId) {
			map.remove(planId);
		}

	}

	//
	//
	//
	//

	private MappedCodes<Integer, SpeedCategory> speedCategoryMappedCodes = DefaultMappedCodes
			.createEnumMapping(SpeedCategory.class, s -> s.ordinal() + 1)
			.flip();

	private MappedCodes<Integer, LocationEntityType> entityTypeMappedCodes = DefaultMappedCodes
			.createEnumMapping(LocationEntityType.class, s -> s.ordinal() + 1)
			.flip();

	private MappedCodes<Integer, ComponentType> componentTypeMappedCodes = DefaultMappedCodes
			.createEnumMapping(ComponentType.class).flip();

	//
	//
	//

	private class RoicNetworkStats {

		private PlanAnalysisReport planAnalysisReport;
		private LocationEntityType type;
		private SpeedCategory speedCategory;
		private RoicComponentInputModel inputModel;

		private double demand;
		private double totalRevenue;
		private double cost;
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
			
			if( arpu == Double.NaN ) {
				throw new RuntimeException("Inbvalid ARPU") ;
			}
		}

		public LocationEntityType getType() {
			return type;
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

		public double getTotalRevenue() {
			return totalRevenue;
		}

		public double getCost() {
			return cost;
		}

		public double getArpu() {
			return arpu;
		}

		public NetworkAnalysisType getNetworkAnalysisType() {
			switch (speedCategory) {
			case cat3:
				return NetworkAnalysisType.copper;
			default:
				return NetworkAnalysisType.fiber;
			}
		}

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

			
			System.out.println(stats.getType() + " " + stats.getArpu()) ;
			
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

	private double getLocationDemand(long planId) {

		NetworkNode node = networkNodeRepository.findEquipment(
				NetworkNodeType.central_office, planId).get(0);

		return node.getHouseHoldCount();
	}

	private int getTotalDemand(long planId) {
		return planRepostory.queryTotalHouseholdLocations(planId);
	}

	private double getCapex(long planId) {
		return costService.getTotalPlanCost(planId);
	}

	private static class ObjectHolder<T> {
		private long lastTouched;
		private T value;

		public ObjectHolder(T value) {
			super();
			this.value = value;
			lastTouched = System.currentTimeMillis();
		}

		public boolean isStale(Long systemTime) {
			return (systemTime - lastTouched) > 1000L * 60L * 30;
		}

	}
}