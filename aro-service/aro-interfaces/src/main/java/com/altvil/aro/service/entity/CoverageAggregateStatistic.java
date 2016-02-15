package com.altvil.aro.service.entity;

import java.io.Serializable;

public interface CoverageAggregateStatistic extends Serializable {
    double getFiberDemand();
    double getScore(double capex);
    void add(CoverageAggregateStatistic other);

    double getMonthlyCashFlowImpact();

    double getDemandCoverage();
}


