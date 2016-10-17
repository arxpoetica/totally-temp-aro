package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimization.strategy.OptimizationNetworkComparator;
import com.altvil.aro.service.optimization.strategy.impl.SingleAreaAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public abstract class AbstractNetworkComparator implements OptimizationNetworkComparator {

    @Override
    public OptimizationImprovement calculateImprovement(PlanAnalysis base, PlanAnalysis compared, SingleAreaAnalysis prunedNetwork) {
        return new OptimizationImprovement(base, compared, getScore(base, compared), getIncrementalBenefit(base, compared), getIncrementalCost(base, compared), prunedNetwork);

    }

    protected double getIncrementalCost(PlanAnalysis base, PlanAnalysis compared){
        return compared.getNetworkFinancials().getFixedCosts() - ((base != null )? base.getNetworkFinancials().getFixedCosts():0);
    }

    protected abstract double getIncrementalBenefit(PlanAnalysis base, PlanAnalysis compared);


    protected abstract double getScore(PlanAnalysis base, PlanAnalysis compared);


}
