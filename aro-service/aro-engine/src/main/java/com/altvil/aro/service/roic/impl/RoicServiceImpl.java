package com.altvil.aro.service.roic.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.MasterPlan;
import com.altvil.aro.model.NetworkNode;
import com.altvil.aro.model.NetworkNodeType;
import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.WirecenterPlan;
import com.altvil.aro.persistence.repository.NetworkNodeRepository;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.service.roic.AnalysisPeriod;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.AnalysisService;
import com.altvil.aro.service.roic.analysis.builder.ComponentInput;
import com.altvil.aro.service.roic.analysis.builder.RoicInputs;
import com.altvil.aro.service.roic.analysis.model.RoicComponent.ComponentType;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.aro.service.roic.analysis.model.RoicNetworkModel.NetworkAnalysisType;
import com.altvil.aro.service.roic.model.NetworkType;
import com.altvil.aro.service.roic.penetration.impl.DefaultNetworkPenetration;

@Service
public class RoicServiceImpl implements RoicService {

	private AnalysisService analysisService;
	private NetworkPlanRepository planRepostory;
	private NetworkNodeRepository networkNodeRepository;

	private Map<NetworkType, RoicInputs> map = new EnumMap<>(NetworkType.class);
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
		RoicInputs copperInputs = RoicInputs.updateInputs(map.get(NetworkType.Copper),
				getTotalDemand(planId), 0);

		RoicInputs fiberInputs = RoicInputs.updateInputs(map.get(NetworkType.Fiber),
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

	@PostConstruct
	public void postConstruct() {
		map.put(NetworkType.Copper, initCopper());
		map.put(NetworkType.Fiber, initFiber());
	}

	private RoicInputs initCopper() {

		RoicInputs ri = new RoicInputs();
		ri.setFixedCost(0);
		ri.setType(NetworkAnalysisType.copper);

		ComponentInput ci = ComponentInput
				.build()
				.setComponentType(ComponentType.household)
				.setArpu(487.26)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.3, 0.15,
								-0.2062994740159)).setChurnRate(0.28)
				.setChurnRateDecrease(0.027).setEntityGrowth(0.01)
				.setOpexPercent(0.4).setMaintenanceExpenses(0.0423).assemble();

		ri.setComponentInputs(Collections.singleton(ci));
		return ri;
	}

	private RoicInputs initFiber() {

		RoicInputs ri = new RoicInputs();
		ri.setFixedCost(0);
		ri.setType(NetworkAnalysisType.fiber);

		ComponentInput ci = ComponentInput
				.build()
				.setComponentType(ComponentType.household)
				.setArpu(1898.7264)
				.setNetworkPenetration(
						new DefaultNetworkPenetration(0.0, 0.5, -.25))
				.setEntityGrowth(0.01).setChurnRateDecrease(20.56)
				.setOpexPercent(0.5).setMaintenanceExpenses(0.0423)
				.setEntityGrowth(0.01).setConnectionCost(204.0).assemble();

		ri.setComponentInputs(Collections.singleton(ci));
		return ri;

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
