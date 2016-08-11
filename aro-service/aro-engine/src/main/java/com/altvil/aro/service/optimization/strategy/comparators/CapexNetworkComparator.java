package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public class CapexNetworkComparator extends AbstractNetworkComparator{
    @Override
    protected double getIncrementalBenefit(OptimizedNetwork base, OptimizedNetwork compared) {
        return compared.getAnalysisNode().getFiberCoverage().getRawCoverage() - (base != null?base.getAnalysisNode().getFiberCoverage().getRawCoverage():0);
    }

    @Override
    protected double getScore(OptimizedNetwork base, OptimizedNetwork compared) {
        return getIncrementalBenefit(base,compared) / getIncrementalCost(base, compared);
    }
}
