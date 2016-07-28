package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.constraints.ThresholdBudgetConstraint;

public interface TargetEvaluatorFactory {

    OptimizationTargetEvaluator getTargetEvaluator(ThresholdBudgetConstraint constraints);

}
