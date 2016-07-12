package com.altvil.aro.service.optimization.strategy;

import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

import java.util.Collection;

public interface OptimizationTargetEvaluator {


    /**
     *
     * @param optimizedNetwork
     * @return is targetMet
     */
    boolean addNetwork(OptimizationImprovement optimizedNetwork);


    Collection<PlannedNetwork> getEvaluatedNetworks();
}
