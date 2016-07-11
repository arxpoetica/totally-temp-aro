package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimization.strategy.OptimizationNetworkComparator;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public abstract class AbstractNetworkComparator implements OptimizationNetworkComparator {

    @Override
    public OptimizationImprovement calculateImprovement(OptimizedNetwork base, OptimizedNetwork compared) {
        return new OptimizationImprovement(base, compared, getScore(base, compared), getIncrementalBenefit(base, compared), getIncrementalCost(base, compared));

    }

    protected double getIncrementalCost(OptimizedNetwork base, OptimizedNetwork compared){
        return compared.getAnalysisNode().getCapex() - base.getAnalysisNode().getCapex();
    }

    protected abstract double getIncrementalBenefit(OptimizedNetwork base, OptimizedNetwork compared);


    protected abstract double getScore(OptimizedNetwork base, OptimizedNetwork compared);


}
