package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.constraints.OptimizationConstraints;
import com.altvil.aro.service.optimization.strategy.OptimizationTargetEvaluator;

public interface TargetEvaluatorFactory {

    OptimizationTargetEvaluator getTargetEvaluator(OptimizationConstraints constraints);

}
