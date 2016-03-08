package com.altvil.aro.service.entity;

import java.io.Serializable;

public interface CoverageAggregateStatistic extends Serializable {
    double getFiberDemand();
    CoverageAggregateStatistic add(CoverageAggregateStatistic coverageStatic) ;
    
}


