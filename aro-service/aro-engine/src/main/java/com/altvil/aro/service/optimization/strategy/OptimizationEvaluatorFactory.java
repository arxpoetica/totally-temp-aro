package com.altvil.aro.service.optimization.strategy;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;
import com.altvil.enumerations.OptimizationMode;

@Service
public class OptimizationEvaluatorFactory {
	@Autowired
	@Qualifier("multiEvaluator")
	OptimizationEvaluatorService multiEvaluator;

	@Autowired
	@Qualifier("singleEvaluator")
	OptimizationEvaluatorService single;

	public OptimizationEvaluator getOptimizationEvaluator(
			ThresholdBudgetConstraint optimizationConstraints,
			OptimizationMode optimizationMode) {
		switch (optimizationMode) {
		case INTER_WIRECENTER:
			return multiEvaluator.getOptimizationEvaluator(
					optimizationConstraints);
		case INTRA_WIRECENTER:
			return single.getOptimizationEvaluator(optimizationConstraints);
		default:
			throw new RuntimeException("Optimization mode " + optimizationMode
					+ " not supported");

		}

	}
}
