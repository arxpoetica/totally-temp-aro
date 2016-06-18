package com.altvil.aro.service.roic.impl;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.WirecenterPlan;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.AnalysisPeriod;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.model.RoicConstants;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.builder.RoicInputs;

@Service
public class RoicServiceImpl implements RoicService {

	private AnalysisService analysisService;
	private NetworkPlanRepository planRepostory;
	private NetworkNodeRepository networkNodeRepository;

	private SuperSimpleCache cache;

	@Autowired
	public RoicServiceImpl(AnalysisService analysisService,
			NetworkPlanRepository planRepostory,
			NetworkNodeRepository networkNodeRepository) {
		super();
		this.analysisService = analysisService;
		this.planRepostory = planRepostory;
		this.networkNodeRepository = networkNodeRepository;

		cache = new SuperSimpleCache();
	}

	@Override
	public void invalidatePlan(long planId) {
		cache.invalidate(planId);
	}

	@Override
	public RoicModel getRoicModel(long planId) {

		NetworkPlan plan = planRepostory.findOne(planId);
		if (plan instanceof MasterPlan) {
			List<WirecenterPlan> childPlans = planRepostory
					.queryChildPlans(planId);
			if (childPlans.size() > 0) {

				Optional<WirecenterPlan> wp = childPlans.stream()
						.filter(p -> p.getTotalCost() != null).findFirst();
				if (wp.isPresent()) {
					return getWirecenterRoicModel(wp.get().getId());
				}

			}
			return null;
		}

		return getWirecenterRoicModel(planId);

	}

	private RoicModel getWirecenterRoicModel(long planId) {

		RoicModel model = cache.get(planId);
		if (model == null) {
			cache.write(planId, model = loadRoic(planId));
		}

		return model;
	}

	

	private RoicModel loadRoic(Long planId) {
		RoicInputs copperInputs = RoicInputs.updateInputs(RoicConstants.CopperInputs,
				getTotalDemand(planId), 0);

		RoicInputs fiberInputs = RoicInputs.updateInputs(RoicConstants.FiberConstants,
				getLocationDemand(planId), getCapex(planId));

		return analysisService.createRoicModelBuilder()
				.setAnalysisPeriod(new AnalysisPeriod(2016, 15))
				.addRoicInputs(copperInputs).addRoicInputs(fiberInputs).build();

	}

	private double getLocationDemand(long planId) {

		NetworkNode node = networkNodeRepository.findEquipment(
				NetworkNodeType.central_office.getId(), planId).get(0);

		return node.getHouseHoldCount();
	}

	private int getTotalDemand(long planId) {
		return planRepostory.queryTotalHouseholdLocations(planId);
	}

	private double getCapex(long planId) {
		return networkNodeRepository.getTotalCost(planId);
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

		private Map<Long, ObjectHolder<RoicModel>> map = new HashMap<>();
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
				ObjectHolder<RoicModel> m = map.get(id);
				if (m.isStale(time)) {
					map.remove(id);
				}
			}
		}

		public synchronized RoicModel get(Long id) {
			ObjectHolder<RoicModel> h = map.get(id);
			return (h == null) ? null : h.value;
		}

		public synchronized void write(Long id, RoicModel model) {
			map.put(id, new ObjectHolder<>(model));
		}

		public synchronized void invalidate(Long planId) {
			map.remove(planId);
		}

	}

}
