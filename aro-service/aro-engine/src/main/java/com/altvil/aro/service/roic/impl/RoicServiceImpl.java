package com.altvil.aro.service.roic.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.WirecenterPlan;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.builder.RoicConstants;
import com.altvil.aro.service.roic.analysis.builder.model.RoicBuilderService;
import com.altvil.aro.service.roic.analysis.builder.network.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicModel;

@Service
public class RoicServiceImpl implements RoicService {

	private RoicBuilderService roicBuilderService;
	private NetworkPlanRepository planRepostory;
	private NetworkNodeRepository networkNodeRepository;
	private NetworkReportService costService;

	private SuperSimpleCache cache;

	@Autowired
	public RoicServiceImpl(RoicBuilderService roicBuilderService,
			NetworkPlanRepository planRepostory,
			NetworkNodeRepository networkNodeRepository, NetworkReportService costService) {
		super();
		this.roicBuilderService = roicBuilderService;
		this.planRepostory = planRepostory;
		this.networkNodeRepository = networkNodeRepository;
		this.costService = costService;

		cache = new SuperSimpleCache();
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
				.collect(Collectors.toList());

		if (models.size() == 0) {
			return Optional.empty();
		}

		return Optional.of(roicBuilderService.aggregate().addAll(models).sum());
	}

	private RoicModel loadRoic(WirecenterPlan plan) {

		long planId = plan.getId();

		RoicInputs copperInputs = RoicInputs.updateInputs(
				RoicConstants.CopperInputs, getTotalDemand(planId), 0);

		RoicInputs fiberInputs = RoicInputs.updateInputs(
				RoicConstants.FiberConstants, getLocationDemand(planId),
				getCapex(planId));

		return roicBuilderService.buildModel()
				.setAnalysisPeriod(new AnalysisPeriod(2016, 15))
				.addRoicInputs(copperInputs).addRoicInputs(fiberInputs).build();

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

}
