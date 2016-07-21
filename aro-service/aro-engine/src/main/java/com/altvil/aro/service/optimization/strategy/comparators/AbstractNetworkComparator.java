package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimization.strategy.OptimizationNetworkComparator;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public abstract class AbstractNetworkComparator implements OptimizationNetworkComparator {

    @Override
    public OptimizationImprovement calculateImprovement(OptimizedNetwork base, OptimizedNetwork compared, PrunedNetwork prunedNetwork) {
        return new OptimizationImprovement(base, compared, getScore(base, compared), getIncrementalBenefit(base, compared), getIncrementalCost(base, compared), prunedNetwork);

    }

    protected double getIncrementalCost(OptimizedNetwork base, OptimizedNetwork compared){
        return compared.getAnalysisNode().getCapex() - ((base != null )? base.getAnalysisNode().getCapex():0);
    }

    protected abstract double getIncrementalBenefit(OptimizedNetwork base, OptimizedNetwork compared);


    protected abstract double getScore(OptimizedNetwork base, OptimizedNetwork compared);


}
