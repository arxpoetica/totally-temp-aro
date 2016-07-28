package com.altvil.aro.service.optimization.strategy;

import java.util.Collection;

import com.altvil.aro.service.optimization.strategy.comparators.OptimizationImprovement;
import com.altvil.aro.service.optimization.wirecenter.PlannedNetwork;

public interface OptimizationTargetEvaluator {


    /**
     *
     * @param optimizedNetwork
     * @return is targetMet
     */
    boolean addNetwork(OptimizationImprovement optimizedNetwork);


    Collection<PlannedNetwork> getEvaluatedNetworks();
}
