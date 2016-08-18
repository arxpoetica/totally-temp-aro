package com.altvil.aro.service.optimization.wirecenter;

import java.util.concurrent.Future;

import com.altvil.aro.service.optimization.ExecutionPlanner;
import com.altvil.aro.service.optimization.ExpandedRoutingOptimization;
import com.altvil.aro.service.optimization.OptimizationPlannerService;
import com.altvil.aro.service.optimization.master.OptimizedMasterPlan;
import com.altvil.enumerations.AlgorithmType;
import com.altvil.enumerations.OptimizationType;
import com.google.common.base.Supplier;

public class ExecutorPlannerImpl implements ExecutionPlanner {

	private ExpandedRoutingOptimization expandedRoutingOptimization;
	private OptimizationPlannerService optimizationPlannerService;

	@Override
	public Supplier<Future<OptimizedMasterPlan>> createPlan(AlgorithmType type,
			MasterOptimizationRequest request) {
		return () -> {
			switch (type) {
			case ROUTING:
				throw new RuntimeException("Back Haul Operation not supported");
			case EXPANDED_ROUTING:
				return expandedRoutingOptimization.optimize(request);
			default: // PLANNING PRUNING
				return optimizationPlannerService.optimize(request);
			}
		};
	}

	@Override
	public Supplier<Future<OptimizedMasterPlan>> createPlan(
			MasterOptimizationRequest request) {
		return createPlan(inferAlgorithmType(request), request);
	}

	private AlgorithmType inferAlgorithmType(MasterOptimizationRequest request) {
		if (request.getOptimizationConstraints() == null
				|| request.getOptimizationConstraints().getOptimizationType() == OptimizationType.UNCONSTRAINED
				|| request.getOptimizationConstraints().getOptimizationType() == OptimizationType.CAPEX) {

			return AlgorithmType.PLANNING;
		}

		switch (request.getOptimizationConstraints().getOptimizationType()) {

		case PRUNNING_NPV:
			return AlgorithmType.EXPANDED_ROUTING;
		case SUPER_LAYER_ROUTING:
			return AlgorithmType.ROUTING;
		case CAPEX:
		case COVERAGE:
		case IRR:
		case NPV:
			return AlgorithmType.PRUNING;
		default:
			return AlgorithmType.PLANNING;
		}
	}
}
