package com.altvil.aro.service.roic.impl;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Timer;
import java.util.TimerTask;
import java.util.function.Supplier;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.model.NetworkPlan;
import com.altvil.aro.model.RoicComponentInputModel;
import com.altvil.aro.persistence.repository.NetworkPlanRepository;
import com.altvil.aro.persistence.repository.RoicComponentInputModelRepository;
import com.altvil.aro.service.optimization.wirecenter.NetworkDemandSummary;
import com.altvil.aro.service.report.NetworkReportService;
import com.altvil.aro.service.report.PlanAnalysisReport;
import com.altvil.aro.service.roic.RoicEngineService;
import com.altvil.aro.service.roic.RoicFinancialInput;
import com.altvil.aro.service.roic.RoicService;
import com.altvil.aro.service.roic.analysis.model.RoicModel;
import com.altvil.utils.reference.VolatileReference;

@Service
public class RoicServiceImpl implements RoicService {

	private static final Logger log = LoggerFactory
			.getLogger(RoicServiceImpl.class.getName());

	private NetworkPlanRepository planRepostory;
	private RoicComponentInputModelRepository roicComponentInputModelRepository;
	private NetworkReportService networkReportService;

	private RoicEngineService roicInputService;

	private SuperSimpleCache cache;
	VolatileReference<Collection<RoicComponentInputModel>> roicInputRef;

	@Autowired
	public RoicServiceImpl(
			NetworkPlanRepository planRepostory,
			RoicComponentInputModelRepository roicComponentInputModelRepository,
			NetworkReportService networkReportService,
			RoicEngineService roicInputService) {
		super();
		this.planRepostory = planRepostory;
		this.roicComponentInputModelRepository = roicComponentInputModelRepository;
		this.networkReportService = networkReportService;
		this.roicInputService = roicInputService;

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

		NetworkPlan plan = planRepostory.getOne(planId) ;
		
		if( plan == null ) {
			return null ;
		}
		
		Optional<RoicModel> m = getRoicModel(planId,
				() -> Optional.of(loadRoic(planId)));

		return m.isPresent() ? m.get() : null;
	}

	private Optional<RoicModel> getRoicModel(Long planId,
			Supplier<Optional<RoicModel>> s) {

		Optional<RoicModel> model = cache.get(planId);
		if (model == null) {
			cache.write(planId, model = s.get());
		}

		return model;
	}

	

	private RoicModel loadRoic(long planId) {

		try {

			PlanAnalysisReport report = networkReportService
					.loadSummarizedPlan(planId).getPlanAnalysisReport();

			return roicInputService.loadRoicModel(new RoicFinancialInput() {
				@Override
				public double getFixedCosts() {
					return report.getPriceModel().getTotalCost();
				}

				@Override
				public NetworkDemandSummary getDemandSummary() {
					return report.getDemandSummary();
				}
			});

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