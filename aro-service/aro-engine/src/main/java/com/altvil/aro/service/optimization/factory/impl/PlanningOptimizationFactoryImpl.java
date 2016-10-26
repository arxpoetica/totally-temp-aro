package com.altvil.aro.service.optimization.factory.impl;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.factory.PlanningOptimizationFactory;
import com.altvil.aro.service.optimization.factory.WireCenterPlanningStrategy;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationRequest;
import com.altvil.aro.service.optimization.wirecenter.WirecenterOptimizationService;
import com.altvil.utils.StreamUtil;

@Service
public class PlanningOptimizationFactoryImpl implements
		PlanningOptimizationFactory {

	private WirecenterOptimizationService wirecenterOptimizationService;
	private ApplicationContext appContext ;
	
	
	@Autowired
	public PlanningOptimizationFactoryImpl(
			WirecenterOptimizationService wirecenterOptimizationService,
			ApplicationContext appContext) {
		super();
		this.wirecenterOptimizationService = wirecenterOptimizationService;
		this.appContext = appContext;
	}

	private static final List<String> tabcGenerations = Arrays
			.asList(new String[] { "T", "A", "B", "C" });

	private Map<String, Function<WirecenterOptimizationRequest, WireCenterPlanningStrategy>> map = new HashMap<>();

	@Override
	public WireCenterPlanningStrategy create(
			WirecenterOptimizationRequest request) {

		switch (request.getOptimizationConstraints().getOptimizationType()) {
		case CUSTOM:
			return map.get(request.getCustomOptimization().getName()).apply(
					request);
		default:
			return () -> wirecenterOptimizationService.planNetwork(request);
		}
	}

	@PostConstruct
	void postConstruct() {
		map.put("TABC",
				request -> {
					TabcOptimizationStrategy strategy =  new TabcOptimizationStrategy(request,
							parseStringList(request.getCustomOptimization()
									.getMap().get("generations"),
									tabcGenerations));
					strategy.initialize(appContext);
					return strategy ;
				});
	}

	private Collection<String> parseStringList(String s,
			Collection<String> defaultResult) {

		if (s == null || s.length() == 0) {
			return defaultResult;
		}

		return StreamUtil.map(s.split(","), v -> v.trim().toUpperCase());

	}

}
