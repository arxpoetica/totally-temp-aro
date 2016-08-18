package com.altvil.aro.service.optimization.impl;

import java.util.EnumMap;
import java.util.Map;
import java.util.concurrent.Future;

import javax.annotation.PostConstruct;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.ExpandedRoutingOptimization;
import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.impl.type.MasterOptimizer;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.aro.service.optimization.spi.OptimizationExecutor;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService;
import com.altvil.aro.service.optimization.spi.OptimizationExecutorService.ExecutorType;
import com.altvil.aro.service.optimization.wirecenter.MasterOptimizationRequest;
import com.altvil.enumerations.OptimizationType;

@Service
public class NewOptimizationPlannerServiceImpl implements
		ExpandedRoutingOptimization {

	@Autowired
	private OptimizationExecutorService optimizationExecutorService;

	private OptimizationExecutor masterPlanExecutor;

	private Map<OptimizationType, MasterOptimizer> optimizerByType = new EnumMap<>(OptimizationType.class);
	
	@Autowired
	public void injectTypeOptimizers(MasterOptimizer[] typeOptimizers) {
		types: for (OptimizationType type : OptimizationType.values()) {

			for (MasterOptimizer typeOptimizer : typeOptimizers) {
				if (typeOptimizer.isOptimizerFor(type)) {
					optimizerByType.put(type, typeOptimizer);
					continue types;
				}
			}

			throw new IllegalStateException("No MasterOptimizer found for " + type);
		}
	}

	@PostConstruct
	void postConstruct() {
		masterPlanExecutor = optimizationExecutorService
				.createOptimizationExecutor(ExecutorType.MasterPlan);
	}

	@Override
	public Future<OptimizedMasterPlan> optimize(
			MasterOptimizationRequest request) {
		MasterOptimizer masterOptimizer = selectMasterOptimizer(request);
		return masterPlanExecutor.submit(() -> masterOptimizer
				.optimize(request));
	}

	private MasterOptimizer selectMasterOptimizer(
			MasterOptimizationRequest request) {

		final OptimizationConstraints optimizationConstraints = request.getOptimizationConstraints();
		final OptimizationType optimizationType = optimizationConstraints == null ? OptimizationType.UNCONSTRAINED : optimizationConstraints.getOptimizationType();
		return optimizerByType.get(optimizationType);

	}
}
