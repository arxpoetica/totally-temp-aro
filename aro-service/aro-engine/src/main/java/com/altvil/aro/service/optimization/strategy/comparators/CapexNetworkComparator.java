package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimize.OptimizedNetwork;

public class CapexNetworkComparator extends AbstractNetworkComparator{
    @Override
    protected double getIncrementalBenefit(PlanAnalysis base, PlanAnalysis compared) {
        return compared.getOptimizedNetwork().getAnalysisNode().getFiberCoverage().getRawCoverage() - (base != null?base.getOptimizedNetwork().getAnalysisNode().getFiberCoverage().getRawCoverage():0);
    }

    @Override
    protected double getScore(PlanAnalysis base, PlanAnalysis compared) {
        return getIncrementalBenefit(base,compared) / getIncrementalCost(base, compared);
    }
}
