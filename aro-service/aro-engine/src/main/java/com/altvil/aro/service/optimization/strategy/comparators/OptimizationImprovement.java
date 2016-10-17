package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimization.strategy.impl.SingleAreaAnalysis;
import com.altvil.aro.service.optimization.strategy.spi.PlanAnalysis;
import com.altvil.aro.service.optimization.wirecenter.PrunedNetwork;

public class OptimizationImprovement implements Comparable<OptimizationImprovement>{
    private final SingleAreaAnalysis singleAreaAnalysis;
    private PlanAnalysis base;
    private PlanAnalysis improved;
    private final double score;
    private final double incrementalBeneift;
    private final double incrementalCost;

    OptimizationImprovement(PlanAnalysis base, PlanAnalysis improved, double score, double incrementalBeneift, double incrementalCost, SingleAreaAnalysis singleAreaAnalysis) {
        this.base = base;
        this.improved = improved;
        this.score = score;
        this.incrementalBeneift = incrementalBeneift;
        this.incrementalCost = incrementalCost;
        this.singleAreaAnalysis = singleAreaAnalysis;
    }


    public double getScore() {
        return score;
    }

    public PlanAnalysis getBase() {
        return base;
    }

    public PlanAnalysis getImproved() {
        return improved;
    }

    public double getIncrementalCost() {
        return incrementalCost;
    }

    public double getIncrementalBeneift() {
        return incrementalBeneift;
    }

    public long getPlanId() {
        return singleAreaAnalysis.getPlanId();
    }

    public SingleAreaAnalysis getSingleAreaAnalysis() {
        return singleAreaAnalysis;
    }

    @Override
    public int compareTo(OptimizationImprovement o) {
        return Double.compare(this.score, o.score);
    }


    public double[] getIncrementalCashFlow() {
        if(base == null)
            return improved.getCashFlows().getAsRawData();
        else {
            return improved.getCashFlows()
                    .subtract(base.getCashFlows())
                    .getAsRawData();
        }
    }
}
