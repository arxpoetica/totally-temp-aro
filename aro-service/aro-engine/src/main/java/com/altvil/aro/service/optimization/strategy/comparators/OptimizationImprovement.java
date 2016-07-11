package com.altvil.aro.service.optimization.strategy.comparators;

import com.altvil.aro.service.optimize.OptimizedNetwork;

public class OptimizationImprovement implements Comparable<OptimizationImprovement>{
    private OptimizedNetwork base;
    private OptimizedNetwork improved;
    private final double score;
    private final double incrementalBeneift;
    private final double incrementalCost;

    OptimizationImprovement(OptimizedNetwork base, OptimizedNetwork improved, double score, double incrementalBeneift, double incrementalCost) {
        this.base = base;
        this.improved = improved;
        this.score = score;
        this.incrementalBeneift = incrementalBeneift;
        this.incrementalCost = incrementalCost;
    }


    public double getScore() {
        return score;
    }

    public OptimizedNetwork getImproved() {
        return improved;
    }

    @Override
    public int compareTo(OptimizationImprovement o) {
        return Double.compare(this.score, o.score);
    }
}
