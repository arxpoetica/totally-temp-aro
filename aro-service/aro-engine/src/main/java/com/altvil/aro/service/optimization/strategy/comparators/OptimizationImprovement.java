package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public class OptimizationImprovement implements Comparable<OptimizationImprovement>{
    private final long planId;
    private OptimizedNetwork base;
    private OptimizedNetwork improved;
    private final double score;
    private final double incrementalBeneift;
    private final double incrementalCost;

    OptimizationImprovement(OptimizedNetwork base, OptimizedNetwork improved, double score, double incrementalBeneift, double incrementalCost, long planId) {
        this.base = base;
        this.improved = improved;
        this.score = score;
        this.incrementalBeneift = incrementalBeneift;
        this.incrementalCost = incrementalCost;
        this.planId = planId;
    }


    public double getScore() {
        return score;
    }

    public OptimizedNetwork getBase() {
        return base;
    }

    public OptimizedNetwork getImproved() {
        return improved;
    }

    public double getIncrementalCost() {
        return incrementalCost;
    }

    public double getIncrementalBeneift() {
        return incrementalBeneift;
    }

    public long getPlanId() {
        return planId;
    }

    @Override
    public int compareTo(OptimizationImprovement o) {
        return Double.compare(this.score, o.score);
    }


}
