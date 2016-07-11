package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimize.OptimizedNetwork;

import java.util.Collection;

public interface OptimizationTargetEvaluator {

    boolean isTargetMet(Collection<OptimizedNetwork> optimizedNetwork);

}
